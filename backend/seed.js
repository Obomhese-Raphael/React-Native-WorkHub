import seedTeams from "./seeds/teamSeeds.js";

const runSeeds = async () => {
  await seedTeams();
  console.log("Seeding completed");
  process.exit(0);
};

runSeeds();