import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const flags = [
  {
    country: "United States",
    flag: "🇺🇸",
    options: ["United States", "United Kingdom", "France", "Australia"],
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    options: ["France", "United Kingdom", "Netherlands", "United States"],
  },
  {
    country: "Japan",
    flag: "🇯🇵",
    options: ["China", "South Korea", "Japan", "Thailand"],
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    options: ["United States", "Canada", "Denmark", "Norway"],
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    options: ["Belgium", "Germany", "Austria", "Netherlands"],
  },
  {
    country: "France",
    flag: "🇫🇷",
    options: ["France", "Netherlands", "Luxembourg", "Italy"],
  },
  {
    country: "Italy",
    flag: "🇮🇹",
    options: ["Mexico", "Hungary", "Italy", "Ireland"],
  },
  {
    country: "Spain",
    flag: "🇪🇸",
    options: ["Spain", "Portugal", "Colombia", "Mexico"],
  },
  {
    country: "Brazil",
    flag: "🇧🇷",
    options: ["Portugal", "Brazil", "Argentina", "Mexico"],
  },
  {
    country: "India",
    flag: "🇮🇳",
    options: ["India", "Ireland", "Italy", "Hungary"],
  },
  {
    country: "China",
    flag: "🇨🇳",
    options: ["China", "Japan", "Vietnam", "North Korea"],
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    options: ["New Zealand", "United Kingdom", "Australia", "Fiji"],
  },
  {
    country: "South Korea",
    flag: "🇰🇷",
    options: ["Japan", "China", "South Korea", "Taiwan"],
  },
  {
    country: "Mexico",
    flag: "🇲🇽",
    options: ["Italy", "Spain", "Mexico", "Colombia"],
  },
  {
    country: "Netherlands",
    flag: "🇳🇱",
    options: ["France", "Russia", "Netherlands", "Luxembourg"],
  },
  {
    country: "Switzerland",
    flag: "🇨🇭",
    options: ["Denmark", "Switzerland", "Sweden", "Norway"],
  },
  {
    country: "Sweden",
    flag: "🇸🇪",
    options: ["Norway", "Denmark", "Finland", "Sweden"],
  },
  {
    country: "Norway",
    flag: "🇳🇴",
    options: ["Iceland", "Norway", "Denmark", "Finland"],
  },
  {
    country: "South Africa",
    flag: "🇿🇦",
    options: ["Kenya", "Nigeria", "South Africa", "Ethiopia"],
  },
  {
    country: "Argentina",
    flag: "🇦🇷",
    options: ["Uruguay", "Argentina", "Chile", "Greece"],
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Create a demo user (creator)
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Check if user exists first
  let user = await prisma.user.findUnique({
    where: { email: "demo@kuiz.app" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@kuiz.app",
        name: "Demo Creator",
        password: hashedPassword,
      },
    });
    console.log("✅ Created demo user:", user.email);
  } else {
    console.log("✅ Demo user already exists:", user.email);
  }

  // Create Flag Quiz Template
  let template = await prisma.template.findFirst({
    where: {
      title: "World Flags Quiz",
      creatorId: user.id,
    },
  });

  if (!template) {
    template = await prisma.template.create({
      data: {
        title: "World Flags Quiz",
        description:
          "Test your knowledge of world flags! Identify the country for each flag shown.",
        category: "Geography",
        isPublic: true,
        creatorId: user.id,
      },
    });
    console.log("✅ Created template:", template.title);
  } else {
    console.log("✅ Template already exists:", template.title);
  }

  // Create questions for each flag
  const existingQuestions = await prisma.question.findMany({
    where: { templateId: template.id },
  });

  if (existingQuestions.length === 0) {
    for (let i = 0; i < flags.length; i++) {
      const flagData = flags[i];

      await prisma.question.create({
        data: {
          templateId: template.id,
          type: "MULTIPLE_CHOICE",
          text: `Which country does this flag belong to? ${flagData.flag}`,
          options: flagData.options,
          correctAnswer: flagData.country,
          order: i,
          points: 10,
          timeLimit: 15, // 15 seconds per question
        },
      });
    }
    console.log(`✅ Created ${flags.length} flag questions`);
  } else {
    console.log(
      `✅ Questions already exist (${existingQuestions.length} questions)`
    );
  }

  // Create additional templates
  const templates = [
    {
      title: "Capital Cities Quiz",
      description: "How well do you know world capitals?",
      category: "Geography",
    },
    {
      title: "Math Challenge",
      description: "Test your mathematical skills",
      category: "Mathematics",
    },
    {
      title: "Science Trivia",
      description: "General science knowledge test",
      category: "Science",
    },
  ];

  for (const tmpl of templates) {
    await prisma.template.create({
      data: {
        ...tmpl,
        creatorId: user.id,
        isPublic: true,
      },
    });
  }

  console.log("✅ Created additional templates");

  // Create a demo session for the Flag Quiz in HOST_CONTROLLED mode
  const existingSession = await prisma.session.findFirst({
    where: {
      templateId: template.id,
      hostId: user.id,
    },
  });

  if (!existingSession) {
    // Generate a simple demo code
    const demoSession = await prisma.session.create({
      data: {
        code: "FLAG01",
        templateId: template.id,
        hostId: user.id,
        status: "WAITING",
        mode: "HOST_CONTROLLED",
      },
    });
    console.log(`✅ Created demo session with code: ${demoSession.code}`);
  } else {
    console.log("✅ Demo session already exists");
  }

  console.log("🎉 Seed completed successfully!");
  console.log("\n📝 Demo credentials:");
  console.log("   Email: demo@kuiz.app");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
