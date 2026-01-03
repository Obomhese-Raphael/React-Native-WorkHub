import teamModel from "../models/Team";

const seedTeams = async () => {
  try {
    // Clear existing teams
    await teamModel.deleteMany({});

    // Sample teams
    const sampleTeams = [
      {
        name: "Marketing Team",
        description: "Handles all marketing campaigns and strategies",
        createdBy: "user_123",
        color: "#FF6B6B",
        members: [
          { userId: "user_123", role: "admin" },
          { userId: "dev-user-123", name: "Dev User", email: "dev@example.com", role: "admin" },
          { userId: "user_456", role: "member" },
          { userId: "user_789", role: "member" },
        ],
      },
      {
        name: "Development Team",
        description: "Software development and engineering",
        createdBy: "user_123",
        color: "#4ECDC4",
        members: [
          { userId: "user_123", role: "admin" },
          { userId: "user_101", role: "member" },
          { userId: "user_102", role: "member" },
        ],
      },
      {
        name: "Design Team",
        description: "UI/UX design and branding",
        createdBy: "user_456",
        color: "#45B7D1",
        members: [
          { userId: "user_456", role: "admin" },
          { userId: "user_789", role: "member" },
        ],
      },
    ];

    await teamModel.insertMany(sampleTeams);
    console.log("✅ Sample teams created successfully");
  } catch (error) {
    console.error("❌ Error seeding teams:", error);
  }
};

export default seedTeams;
