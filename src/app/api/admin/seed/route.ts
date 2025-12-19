import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import OnboardingQuestion from "@/models/OnboardingQuestion";
import DailyCheckinQuestion from "@/models/DailyCheckinQuestion";
import Affirmation from "@/models/Affirmation";
import WeeklyLecture from "@/models/WeeklyLecture";
import Quote from "@/models/Quote";
import MediaItem from "@/models/MediaItem";
import Notification from "@/models/Notification";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    await connectDB();

    const results = {
      users: { created: 0, skipped: 0 },
      posts: { created: 0, skipped: 0 },
      onboardingQuestions: { created: 0, skipped: 0 },
      dailyCheckinQuestions: { created: 0, skipped: 0 },
      affirmations: { created: 0, skipped: 0 },
      weeklyLectures: { created: 0, skipped: 0 },
      quotes: { created: 0, skipped: 0 },
      mediaItems: { created: 0, skipped: 0 },
      notifications: { created: 0, skipped: 0 },
    };

    // 1. Create Demo Users
    const demoUsers = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password123",
        birthdate: new Date("1990-01-15"),
        active: true,
        streak: 5,
        activity: {
          totalCheckIns: 25,
          totalPosts: 3,
          lastCheckIn: new Date(),
        },
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        password: "password123",
        birthdate: new Date("1992-05-20"),
        active: true,
        streak: 12,
        activity: {
          totalCheckIns: 45,
          totalPosts: 7,
          lastCheckIn: new Date(),
        },
      },
      {
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        password: "password123",
        birthdate: new Date("1988-11-10"),
        active: true,
        streak: 3,
        activity: {
          totalCheckIns: 15,
          totalPosts: 2,
          lastCheckIn: new Date(),
        },
      },
      {
        name: "Sarah Williams",
        email: "sarah.williams@example.com",
        password: "password123",
        birthdate: new Date("1995-03-25"),
        active: true,
        streak: 8,
        activity: {
          totalCheckIns: 30,
          totalPosts: 5,
          lastCheckIn: new Date(),
        },
      },
      {
        name: "David Brown",
        email: "david.brown@example.com",
        password: "password123",
        birthdate: new Date("1991-07-08"),
        active: true,
        streak: 1,
        activity: {
          totalCheckIns: 5,
          totalPosts: 1,
          lastCheckIn: new Date(),
        },
      },
    ];

    const createdUserIds: string[] = [];
    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        results.users.skipped++;
        createdUserIds.push(existing._id.toString());
        continue;
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      createdUserIds.push(user._id.toString());
      results.users.created++;
    }

    // 2. Create Demo Posts
    const demoPosts = [
      {
        user: createdUserIds[0],
        title: "My Journey to Better Health",
        content: "Starting my wellness journey today! Excited to see the progress.",
        imageUrl: "https://example.com/image1.jpg",
        status: "approved" as const,
        visibility: "public" as const,
        flagged: false,
      },
      {
        user: createdUserIds[1],
        title: "Daily Reflection",
        content: "Today I'm grateful for my family and friends who support me.",
        status: "approved" as const,
        visibility: "public" as const,
        flagged: false,
      },
      {
        user: createdUserIds[2],
        title: "Weekend Plans",
        content: "Planning to spend the weekend focusing on self-care and relaxation.",
        status: "pending" as const,
        visibility: "public" as const,
        flagged: false,
      },
      {
        user: createdUserIds[3],
        title: "Motivational Monday",
        content: "Starting the week with positive energy and clear goals!",
        imageUrl: "https://example.com/image2.jpg",
        status: "approved" as const,
        visibility: "public" as const,
        flagged: true,
      },
      {
        user: createdUserIds[0],
        title: "Progress Update",
        content: "Made great progress this week. Feeling proud of my achievements!",
        status: "approved" as const,
        visibility: "public" as const,
        flagged: false,
      },
    ];

    for (const postData of demoPosts) {
      const existing = await Post.findOne({
        title: postData.title,
        user: postData.user,
      });
      if (existing) {
        results.posts.skipped++;
        continue;
      }
      await Post.create(postData);
      results.posts.created++;
    }

    // 3. Create Onboarding Questions
    const demoOnboardingQuestions = [
      {
        title: "What is your primary wellness goal?",
        description: "Select the main goal you want to achieve",
        type: "single" as const,
        options: [
          { label: "Weight management", value: "weight" },
          { label: "Mental health", value: "mental" },
          { label: "Physical fitness", value: "fitness" },
          { label: "Stress reduction", value: "stress" },
          { label: "Better sleep", value: "sleep" },
        ],
        order: 1,
        active: true,
      },
      {
        title: "How would you describe your current activity level?",
        description: "Choose the option that best describes you",
        type: "single" as const,
        options: [
          { label: "Very active", value: "very" },
          { label: "Moderately active", value: "moderate" },
          { label: "Somewhat active", value: "somewhat" },
          { label: "Not very active", value: "not" },
        ],
        order: 2,
        active: true,
      },
      {
        title: "What areas would you like to focus on?",
        description: "You can select multiple options",
        type: "multi" as const,
        options: [
          { label: "Nutrition", value: "nutrition" },
          { label: "Exercise", value: "exercise" },
          { label: "Mindfulness", value: "mindfulness" },
          { label: "Sleep", value: "sleep" },
          { label: "Relationships", value: "relationships" },
          { label: "Career", value: "career" },
        ],
        order: 3,
        active: true,
      },
      {
        title: "What is your birthdate?",
        description: "This helps us personalize your experience",
        type: "date" as const,
        options: [],
        order: 4,
        active: true,
      },
      {
        title: "How many days per week can you commit?",
        description: "Select the number of days",
        type: "days" as const,
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
          { label: "5", value: "5" },
          { label: "6", value: "6" },
          { label: "7", value: "7" },
        ],
        order: 5,
        active: true,
      },
    ];

    for (const qData of demoOnboardingQuestions) {
      const existing = await OnboardingQuestion.findOne({ title: qData.title });
      if (existing) {
        results.onboardingQuestions.skipped++;
        continue;
      }
      await OnboardingQuestion.create(qData);
      results.onboardingQuestions.created++;
    }

    // 4. Create Daily Check-in Questions
    const demoDailyCheckinQuestions = [
      {
        title: "How are you feeling today?",
        description: "Rate your overall mood",
        type: "scale" as const,
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
          { label: "5", value: "5" },
          { label: "6", value: "6" },
          { label: "7", value: "7" },
          { label: "8", value: "8" },
          { label: "9", value: "9" },
          { label: "10", value: "10" },
        ],
        order: 1,
        active: true,
      },
      {
        title: "Did you complete your daily goals?",
        description: "Select all that apply",
        type: "multi" as const,
        options: [
          { label: "Exercise", value: "exercise" },
          { label: "Meditation", value: "meditation" },
          { label: "Healthy meals", value: "meals" },
          { label: "Water intake", value: "water" },
          { label: "Sleep schedule", value: "sleep" },
        ],
        order: 2,
        active: true,
      },
      {
        title: "What challenges did you face today?",
        description: "Share your thoughts",
        type: "text" as const,
        options: [],
        order: 3,
        active: true,
      },
      {
        title: "What are you grateful for today?",
        description: "List the things you're thankful for",
        type: "text" as const,
        options: [],
        order: 4,
        active: true,
      },
    ];

    for (const qData of demoDailyCheckinQuestions) {
      const existing = await DailyCheckinQuestion.findOne({ title: qData.title });
      if (existing) {
        results.dailyCheckinQuestions.skipped++;
        continue;
      }
      await DailyCheckinQuestion.create(qData);
      results.dailyCheckinQuestions.created++;
    }

    // 5. Create Affirmations
    const demoAffirmations = [
      {
        title: "Morning Affirmation",
        text: "I am capable of achieving my goals and creating positive change in my life.",
        reflectionPrompt: "What steps can you take today to move closer to your goals?",
        scheduledFor: new Date(),
        archived: false,
      },
      {
        title: "Evening Reflection",
        text: "I am grateful for the progress I made today, no matter how small.",
        reflectionPrompt: "What are three things you accomplished today?",
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        archived: false,
      },
      {
        title: "Weekly Motivation",
        text: "I trust in my ability to overcome challenges and grow stronger.",
        reflectionPrompt: "How have you grown this week?",
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        archived: false,
      },
    ];

    for (const affData of demoAffirmations) {
      const existing = await Affirmation.findOne({ title: affData.title });
      if (existing) {
        results.affirmations.skipped++;
        continue;
      }
      await Affirmation.create(affData);
      results.affirmations.created++;
    }

    // 6. Create Weekly Lectures
    const demoWeeklyLectures = [
      {
        title: "Week 1: Introduction to Wellness",
        imageUrl: "https://example.com/lecture1.jpg",
        affirmationText: "Wellness is a journey, not a destination.",
        reflectionText: "Reflect on what wellness means to you and how you can incorporate it into your daily life.",
        weekOf: new Date(),
        published: true,
        archived: false,
      },
      {
        title: "Week 2: Building Healthy Habits",
        imageUrl: "https://example.com/lecture2.jpg",
        affirmationText: "Small consistent actions lead to significant results.",
        reflectionText: "What small habit can you start today that will benefit you in the long run?",
        weekOf: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        published: false,
        archived: false,
      },
    ];

    for (const lectureData of demoWeeklyLectures) {
      const existing = await WeeklyLecture.findOne({ title: lectureData.title });
      if (existing) {
        results.weeklyLectures.skipped++;
        continue;
      }
      await WeeklyLecture.create(lectureData);
      results.weeklyLectures.created++;
    }

    // 7. Create Quotes
    const demoQuotes = [
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        tags: ["motivation", "career", "success"],
        active: true,
      },
      {
        text: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt",
        tags: ["motivation", "self-belief"],
        active: true,
      },
      {
        text: "It does not matter how slowly you go as long as you do not stop.",
        author: "Confucius",
        tags: ["persistence", "growth"],
        active: true,
      },
      {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        tags: ["dreams", "future", "motivation"],
        active: true,
      },
      {
        text: "You are never too old to set another goal or to dream a new dream.",
        author: "C.S. Lewis",
        tags: ["goals", "dreams", "age"],
        active: true,
      },
    ];

    for (const quoteData of demoQuotes) {
      const existing = await Quote.findOne({
        text: quoteData.text,
        author: quoteData.author,
      });
      if (existing) {
        results.quotes.skipped++;
        continue;
      }
      await Quote.create(quoteData);
      results.quotes.created++;
    }

    // 8. Create Media Items
    const demoMediaItems = [
      {
        title: "Morning Meditation Guide",
        type: "audio" as const,
        url: "https://example.com/audio/meditation.mp3",
        thumbnailUrl: "https://example.com/thumbnails/meditation.jpg",
        durationSeconds: 600,
        tags: ["meditation", "mindfulness", "morning"],
      },
      {
        title: "Yoga Flow for Beginners",
        type: "video" as const,
        url: "https://example.com/video/yoga.mp4",
        thumbnailUrl: "https://example.com/thumbnails/yoga.jpg",
        durationSeconds: 1800,
        tags: ["yoga", "exercise", "beginner"],
      },
      {
        title: "Sleep Stories Collection",
        type: "audio" as const,
        url: "https://example.com/audio/sleep.mp3",
        thumbnailUrl: "https://example.com/thumbnails/sleep.jpg",
        durationSeconds: 2400,
        tags: ["sleep", "relaxation", "bedtime"],
      },
    ];

    for (const mediaData of demoMediaItems) {
      const existing = await MediaItem.findOne({ title: mediaData.title });
      if (existing) {
        results.mediaItems.skipped++;
        continue;
      }
      await MediaItem.create(mediaData);
      results.mediaItems.created++;
    }

    // 9. Create Notifications
    const { Types } = await import("mongoose");
    const demoNotifications = [
      {
        title: "Welcome to Our Community!",
        message: "We're excited to have you here. Start your wellness journey today!",
        target: "all" as const,
        userIds: [],
        status: "sent" as const,
        sentAt: new Date(),
      },
      {
        title: "Weekly Challenge Reminder",
        message: "Don't forget to complete your weekly wellness challenge!",
        target: "users" as const,
        userIds: createdUserIds.slice(0, 3).map((id) => new Types.ObjectId(id)),
        status: "scheduled" as const,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        title: "New Content Available",
        message: "Check out our latest weekly lecture on building healthy habits!",
        target: "all" as const,
        userIds: [],
        status: "draft" as const,
      },
    ];

    for (const notifData of demoNotifications) {
      const existing = await Notification.findOne({ title: notifData.title });
      if (existing) {
        results.notifications.skipped++;
        continue;
      }
      await Notification.create(notifData);
      results.notifications.created++;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Demo data seeded successfully",
        results,
        summary: {
          totalCreated:
            results.users.created +
            results.posts.created +
            results.onboardingQuestions.created +
            results.dailyCheckinQuestions.created +
            results.affirmations.created +
            results.weeklyLectures.created +
            results.quotes.created +
            results.mediaItems.created +
            results.notifications.created,
          totalSkipped:
            results.users.skipped +
            results.posts.skipped +
            results.onboardingQuestions.skipped +
            results.dailyCheckinQuestions.skipped +
            results.affirmations.skipped +
            results.weeklyLectures.skipped +
            results.quotes.skipped +
            results.mediaItems.skipped +
            results.notifications.skipped,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("SEED ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed demo data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
