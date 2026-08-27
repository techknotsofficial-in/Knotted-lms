import { db } from "@/lib/db";
import { CourseLevel, LessonType, EnrollmentStatus } from "@prisma/client";
import { resolveStorageUrl } from "@/lib/storage";

export interface CourseWithDetails {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  previewVideo: string | null;
  price: number;
  currency: string;
  level: CourseLevel;
  isPublished: boolean;
  category: string;
  instructor: {
    id: string;
    name: string | null;
    image: string | null;
  };
  chapters: {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
    lessons: {
      id: string;
      title: string;
      slug: string;
      type: LessonType;
      durationSec: number;
      sortOrder: number;
      isFree: boolean;
    }[];
  }[];
  totalDurationSec?: number;
  totalLessons?: number;
}

/**
 * Get all published courses for the public catalog with retry resilience & signed R2 asset URLs
 */
export async function getPublishedCourses(retries = 2): Promise<any[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const courses = await db.course.findMany({
        where: { isPublished: true },
        include: {
          instructor: {
            select: { id: true, name: true, image: true },
          },
          chapters: {
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  type: true,
                  durationSec: true,
                  sortOrder: true,
                  isFree: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return await Promise.all(
        courses.map(async (course) => {
          const allLessons = course.chapters.flatMap((c) => c.lessons);
          const totalDurationSec = allLessons.reduce((acc, l) => acc + l.durationSec, 0);

          let signedThumbnail = course.thumbnailUrl;
          if (course.thumbnailUrl) {
            signedThumbnail = await resolveStorageUrl(course.thumbnailUrl);
          }

          let signedInstructorImage = course.instructor?.image;
          if (course.instructor?.image) {
            signedInstructorImage = await resolveStorageUrl(course.instructor.image);
          }

          return {
            ...course,
            thumbnailUrl: signedThumbnail,
            instructor: {
              ...course.instructor,
              image: signedInstructorImage,
            },
            price: Number(course.price),
            totalLessons: allLessons.length,
            totalDurationSec,
          };
        })
      );
    } catch (error) {
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 400));
        continue;
      }
      console.error("Failed to fetch published courses from DB:", error);
      return [];
    }
  }
  return [];
}

/**
 * Get single course by slug with full curriculum, signed thumbnails, and retry resilience
 */
export async function getCourseBySlug(slug: string, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const course = await db.course.findUnique({
        where: { slug },
        include: {
          instructor: {
            select: { id: true, name: true, image: true, email: true },
          },
          chapters: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                orderBy: { sortOrder: "asc" },
                include: {
                  attachments: true,
                },
              },
            },
          },
        },
      });

      if (!course) return null;

      const allLessons = course.chapters.flatMap((c) => c.lessons);
      const totalDurationSec = allLessons.reduce((acc, l) => acc + l.durationSec, 0);

      let signedThumbnail = course.thumbnailUrl;
      if (course.thumbnailUrl) {
        signedThumbnail = await resolveStorageUrl(course.thumbnailUrl);
      }

      let signedInstructorImage = course.instructor?.image;
      if (course.instructor?.image) {
        signedInstructorImage = await resolveStorageUrl(course.instructor.image);
      }

      return {
        ...course,
        thumbnailUrl: signedThumbnail,
        instructor: {
          ...course.instructor,
          image: signedInstructorImage,
        },
        price: Number(course.price),
        totalLessons: allLessons.length,
        totalDurationSec,
      };
    } catch (error) {
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 400));
        continue;
      }
      console.error(`Failed to fetch course by slug [${slug}]:`, error);
      return null;
    }
  }
  return null;
}

/**
 * Check user enrollment status for a course
 */
export async function checkUserEnrollment(userId: string, courseId: string): Promise<boolean> {
  try {
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
    return enrollment?.status === EnrollmentStatus.ACTIVE;
  } catch (error) {
    console.error("Error checking user enrollment:", error);
    return false;
  }
}
