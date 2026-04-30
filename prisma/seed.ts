import { DayType, MealType, MealWindow, OverrideReason, Role, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const password = "Demo123!";

function dateAt(dayOffset: number, hour = 12, minute = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dayDate(dayOffset: number) {
  const date = dateAt(dayOffset, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date;
}

function scoreParts(score: number): Prisma.JsonObject {
  if (score >= 8) {
    return { mealQuality: 3, proteinAdequacy: 2, carbohydrateAdequacy: 2, completeness: 2, contextualFit: 1 };
  }
  if (score >= 6) {
    return { mealQuality: 2, proteinAdequacy: 2, carbohydrateAdequacy: 1, completeness: 1, contextualFit: 1 };
  }
  return { mealQuality: 1, proteinAdequacy: 1, carbohydrateAdequacy: 0, completeness: 1, contextualFit: 0 };
}

async function main() {
  await prisma.clubMeal.deleteMany();
  await prisma.fluidCheckIn.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.athleteScheduleOverride.deleteMany();
  await prisma.$executeRaw`DELETE FROM "TeamScheduleEntry"`;
  await prisma.teamScheduleDefault.deleteMany();
  await prisma.parentAthlete.deleteMany();
  await prisma.staffTeam.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.club.deleteMany();

  const club = await prisma.club.create({ data: { name: "EliteFuel Academy" } });
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: { email: "admin@elitefuel.demo", passwordHash, name: "Avery Club Admin", role: Role.CLUB_ADMIN, clubId: club.id }
  });
  const staff = await prisma.user.create({
    data: { email: "jordan.staff@elitefuel.demo", passwordHash, name: "Jordan Reed", role: Role.STAFF, clubId: club.id }
  });
  const mayaUser = await prisma.user.create({
    data: { email: "maya.torres@elitefuel.demo", passwordHash, name: "Maya Torres", role: Role.ATHLETE, clubId: club.id }
  });
  const parent = await prisma.user.create({
    data: { email: "morgan.parent@elitefuel.demo", passwordHash, name: "Morgan Torres", role: Role.PARENT, clubId: club.id }
  });
  const lucaUser = await prisma.user.create({
    data: { email: "luca.rossi@elitefuel.demo", passwordHash, name: "Luca Rossi", role: Role.ATHLETE, clubId: club.id }
  });

  const u16 = await prisma.team.create({ data: { clubId: club.id, name: "U16 Girls Performance", sport: "Soccer" } });
  const u14 = await prisma.team.create({ data: { clubId: club.id, name: "U14 Boys Development", sport: "Soccer" } });
  await prisma.staffTeam.createMany({
    data: [
      { userId: staff.id, teamId: u16.id },
      { userId: staff.id, teamId: u14.id }
    ]
  });

  await prisma.teamScheduleDefault.createMany({
    data: [
      { teamId: u16.id, dayOfWeek: 1, dayType: DayType.TRAINING, title: "Technical training", startTime: "17:30", endTime: "19:00", notes: "Normal training rhythm." },
      { teamId: u16.id, dayOfWeek: 2, dayType: DayType.REHAB, title: "Recovery and mobility", startTime: "16:00", endTime: "17:00", notes: "Lower-load recovery support." },
      { teamId: u16.id, dayOfWeek: 3, dayType: DayType.TRAINING, title: "High-load training", startTime: "17:30", endTime: "19:15", notes: "Fuel before and recovery after." },
      { teamId: u16.id, dayOfWeek: 4, dayType: DayType.REST, title: "Rest day", startTime: null, endTime: null, notes: "Keep meals steady." },
      { teamId: u16.id, dayOfWeek: 5, dayType: DayType.TRAVEL, title: "Away travel prep", startTime: "15:30", endTime: "17:00", notes: "Packable food and fluids." },
      { teamId: u16.id, dayOfWeek: 6, dayType: DayType.MATCH, title: "League match", startTime: "10:00", endTime: "12:00", notes: "Familiar breakfast before kickoff." },
      { teamId: u16.id, dayOfWeek: 0, dayType: DayType.REST, title: "Family recovery day", startTime: null, endTime: null, notes: "Light recovery rhythm." },
      { teamId: u14.id, dayOfWeek: 1, dayType: DayType.TRAINING, title: "Skills training", startTime: "16:30", endTime: "18:00", notes: "After-school snack matters." },
      { teamId: u14.id, dayOfWeek: 2, dayType: DayType.REST, title: "Rest day", startTime: null, endTime: null, notes: "Normal family meals." },
      { teamId: u14.id, dayOfWeek: 3, dayType: DayType.TRAINING, title: "Team training", startTime: "16:30", endTime: "18:00", notes: "Bring water and a snack." },
      { teamId: u14.id, dayOfWeek: 4, dayType: DayType.REST, title: "Rest day", startTime: null, endTime: null, notes: "No team session." },
      { teamId: u14.id, dayOfWeek: 5, dayType: DayType.TRAINING, title: "Match prep", startTime: "16:00", endTime: "17:15", notes: "Shorter session." },
      { teamId: u14.id, dayOfWeek: 6, dayType: DayType.MATCH, title: "Weekend match", startTime: "09:30", endTime: "11:00", notes: "Breakfast and fluids before arrival." },
      { teamId: u14.id, dayOfWeek: 0, dayType: DayType.REST, title: "Family recovery day", startTime: null, endTime: null, notes: "Reset for the week." }
    ]
  });

  await prisma.teamScheduleEntry.createMany({
    data: [
      { teamId: u16.id, date: dayDate(4), dayType: DayType.TRAVEL, title: "Regional tournament travel", startTime: "14:30", endTime: "17:30", notes: "Pack travel snacks and bottles before departure." },
      { teamId: u16.id, date: dayDate(5), dayType: DayType.MATCH, title: "Regional tournament group games", startTime: "09:00", endTime: "15:00", notes: "Multiple games; pack familiar carbs and recovery food." },
      { teamId: u16.id, date: dayDate(12), dayType: DayType.REST, title: "School break recovery day", startTime: null, endTime: null, notes: "No team session." },
      { teamId: u14.id, date: dayDate(3), dayType: DayType.MATCH, title: "Cup friendly", startTime: "18:00", endTime: "19:30", notes: "Evening kickoff after school." },
      { teamId: u14.id, date: dayDate(10), dayType: DayType.TRAVEL, title: "Away match bus departure", startTime: "07:45", endTime: "10:00", notes: "Breakfast and portable snacks needed." }
    ]
  });

  const maya = await prisma.athlete.create({
    data: {
      userId: mayaUser.id,
      clubId: club.id,
      teamId: u16.id,
      firstName: "Maya",
      lastName: "Torres",
      age: 15,
      sport: "Soccer",
      primaryGoal: "Sustain energy for training and improve recovery",
      dietaryRestrictions: "No pork",
      allergies: "None reported",
      injuryStatus: "Return to play",
      sex: "Female",
      position: "Midfielder",
      height: "5'6\"",
      weight: "128 lb",
      foodPreferences: "Likes rice bowls, yogurt, fruit, eggs",
      rehabNotes: "Hamstring return-to-play progression; avoid under-fueling on high-load days.",
      parentContactName: "Morgan Torres",
      parentContactEmail: "morgan.parent@elitefuel.demo"
    }
  });
  const noah = await prisma.athlete.create({
    data: {
      clubId: club.id,
      teamId: u16.id,
      firstName: "Noah",
      lastName: "Singh",
      age: 16,
      sport: "Soccer",
      primaryGoal: "Add lean mass while keeping match speed",
      dietaryRestrictions: "Vegetarian",
      allergies: "Peanuts",
      injuryStatus: "Modified load",
      position: "Forward",
      parentContactName: "Priya Singh",
      parentContactEmail: "priya.singh@example.com"
    }
  });
  const sofia = await prisma.athlete.create({
    data: {
      clubId: club.id,
      teamId: u16.id,
      firstName: "Sofia",
      lastName: "Torres",
      age: 13,
      sport: "Soccer",
      primaryGoal: "Build steady energy for tournament weekends",
      dietaryRestrictions: "None reported",
      allergies: "Tree nuts",
      position: "Winger",
      foodPreferences: "Likes pasta, fruit, cheese sticks",
      parentContactName: "Morgan Torres",
      parentContactEmail: "morgan.parent@elitefuel.demo"
    }
  });
  const grace = await prisma.athlete.create({
    data: {
      clubId: club.id,
      teamId: u16.id,
      firstName: "Grace",
      lastName: "Okafor",
      age: 15,
      sport: "Soccer",
      primaryGoal: "Stay consistent around school and training",
      dietaryRestrictions: "",
      allergies: "",
      position: "Center back"
    }
  });
  const luca = await prisma.athlete.create({
    data: {
      userId: lucaUser.id,
      clubId: club.id,
      teamId: u14.id,
      firstName: "Luca",
      lastName: "Rossi",
      age: 14,
      sport: "Soccer",
      primaryGoal: "Improve recovery after late practices",
      dietaryRestrictions: "None reported",
      allergies: "None reported",
      position: "Midfielder",
      foodPreferences: "Likes sandwiches, pasta, bananas"
    }
  });
  const leo = await prisma.athlete.create({
    data: {
      clubId: club.id,
      teamId: u14.id,
      firstName: "Leo",
      lastName: "Martinez",
      age: 14,
      sport: "Soccer",
      primaryGoal: "Build steady energy for school-day training",
      dietaryRestrictions: "None reported",
      allergies: "None reported",
      position: "Defender",
      foodPreferences: "Likes wraps, bananas, trail mix"
    }
  });
  const ethan = await prisma.athlete.create({
    data: {
      clubId: club.id,
      teamId: u14.id,
      firstName: "Ethan",
      lastName: "Brooks",
      age: 13,
      sport: "Soccer",
      primaryGoal: "Improve recovery after late practices",
      dietaryRestrictions: "Lactose sensitive",
      allergies: "None reported",
      injuryStatus: "Modified load",
      position: "Goalkeeper"
    }
  });
  const ava = await prisma.athlete.create({
    data: {
      clubId: club.id,
      teamId: u14.id,
      firstName: "Ava",
      lastName: "Chen",
      age: 14,
      sport: "Soccer",
      primaryGoal: "Have reliable energy for tournaments",
      dietaryRestrictions: "Pescatarian",
      allergies: "None reported",
      position: "Forward",
      parentContactName: "Lena Chen",
      parentContactEmail: "lena.chen@example.com"
    }
  });

  await prisma.parentAthlete.createMany({
    data: [
      { parentId: parent.id, athleteId: maya.id },
      { parentId: parent.id, athleteId: sofia.id }
    ]
  });

  await prisma.athleteScheduleOverride.createMany({
    data: [
      {
        athleteId: maya.id,
        date: dayDate(0),
        dayType: DayType.RETURN_TO_PLAY,
        reason: OverrideReason.RETURN_TO_PLAY,
        note: "Limit max sprint volume; prioritize post-session recovery."
      },
      {
        athleteId: noah.id,
        date: dayDate(0),
        dayType: DayType.MODIFIED_LOAD,
        reason: OverrideReason.MODIFIED_LOAD,
        note: "Small-sided only after warmup check."
      },
      {
        athleteId: ethan.id,
        date: dayDate(0),
        dayType: DayType.MODIFIED_LOAD,
        reason: OverrideReason.MODIFIED_LOAD,
        note: "Late practice; remind family to plan a recovery snack."
      },
      {
        athleteId: sofia.id,
        date: dayDate(5),
        dayType: DayType.TRAVEL,
        reason: OverrideReason.TRAVEL,
        note: "Pack nut-free tournament snacks."
      }
    ]
  });

  await prisma.followUp.createMany({
    data: [
      { athleteId: maya.id, state: "NEW", reason: OverrideReason.RETURN_TO_PLAY, note: "Confirm recovery snack plan after training.", updatedById: staff.id, createdAt: dateAt(-1, 18, 45), updatedAt: dateAt(-1, 18, 45) },
      { athleteId: noah.id, state: "ACKNOWLEDGED", reason: OverrideReason.MODIFIED_LOAD, note: "Check vegetarian protein at lunch.", updatedById: staff.id, createdAt: dateAt(-2, 12, 10), updatedAt: dateAt(-1, 9, 15) },
      { athleteId: leo.id, state: "NEW", reason: OverrideReason.OTHER, note: "Ask about a simple snack before after-school training.", updatedById: staff.id, createdAt: dateAt(-1, 15, 0), updatedAt: dateAt(-1, 15, 0) },
      { athleteId: ava.id, state: "RESOLVED", reason: OverrideReason.TRAVEL, note: "Family has a tournament packing plan for this weekend.", updatedById: staff.id, createdAt: dateAt(-5, 10, 30), updatedAt: dateAt(-3, 16, 30) }
    ]
  });

  const mealLogs = await prisma.mealLog.createManyAndReturn({
    data: [
      {
        athleteId: maya.id,
        loggedById: mayaUser.id,
        mealType: MealType.BREAKFAST,
        mealWindow: MealWindow.MORNING,
        note: "Eggs, toast, kiwi, avocado and water",
        displayTitle: "Eggs, toast, kiwi, avocado, and water",
        userDetails: "Added water; avocado was a small portion.",
        photoDescription: "Plate with eggs, toast, kiwi, avocado, and water.",
        photoComponents: ["eggs", "toast", "kiwi", "avocado", "water"],
        extractedDescription: "Eggs, toast, kiwi, avocado, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["eggs", "toast", "kiwi", "avocado", "water"],
        suggestedImprovements: ["Good breakfast structure. Keep avocado moderate if training is close, and let toast and kiwi carry the easy fuel."],
        score: 9,
        subScores: scoreParts(9),
        createdAt: dateAt(-1, 8, 5)
      },
      {
        athleteId: maya.id,
        loggedById: parent.id,
        mealType: MealType.SNACK,
        mealWindow: MealWindow.POST_TRAINING,
        note: "Greek yogurt, granola, berries and water after practice",
        displayTitle: "Greek yogurt, granola, berries, and water",
        userDetails: "Logged by parent after late practice.",
        photoDescription: "Bowl with yogurt, granola, berries, and water.",
        photoComponents: ["Greek yogurt", "granola", "berries", "water"],
        extractedDescription: "Greek yogurt, granola, berries, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["Greek yogurt", "granola", "berries", "water"],
        suggestedImprovements: ["Strong recovery snack with protein plus carbohydrate. Keep fluids available after training."],
        score: 9,
        subScores: scoreParts(9),
        createdAt: dateAt(-2, 19, 35)
      },
      {
        athleteId: maya.id,
        loggedById: mayaUser.id,
        mealType: MealType.SNACK,
        mealWindow: MealWindow.PRE_TRAINING,
        note: "Toast, banana, cheddar cheese and water before training",
        displayTitle: "Toast, banana, cheddar, and water",
        userDetails: "Training was about 90 minutes later.",
        photoDescription: "Toast, banana, cheese, and water.",
        photoComponents: ["toast", "banana", "cheddar cheese", "water"],
        extractedDescription: "Toast, banana, cheddar cheese, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["toast", "banana", "cheddar cheese", "water"],
        suggestedImprovements: ["Useful pre-training carbs. Keep cheese moderate if training is close so the snack does not feel heavy."],
        score: 7,
        subScores: scoreParts(7),
        createdAt: dateAt(-3, 15, 45)
      },
      {
        athleteId: noah.id,
        loggedById: staff.id,
        mealType: MealType.LUNCH,
        mealWindow: MealWindow.PRE_TRAINING,
        note: "Rice, tofu, vegetables and water",
        displayTitle: "Rice, tofu, vegetables, and water",
        userDetails: "Vegetarian lunch before modified training.",
        photoDescription: "Rice bowl with tofu, vegetables, and water.",
        photoComponents: ["rice", "tofu", "vegetables", "water"],
        extractedDescription: "Rice, tofu, vegetables, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["rice", "tofu", "vegetables", "water"],
        suggestedImprovements: ["Good vegetarian protein and carb structure. Keep portions comfortable before training."],
        score: 8,
        subScores: scoreParts(8),
        createdAt: dateAt(-1, 12, 20)
      },
      {
        athleteId: noah.id,
        loggedById: staff.id,
        mealType: MealType.SNACK,
        mealWindow: MealWindow.POST_TRAINING,
        note: "Chips and soda after training",
        displayTitle: "Chips and soda",
        userDetails: "No protein source included.",
        photoDescription: "Packaged chips and soda.",
        photoComponents: ["chips", "soda"],
        extractedDescription: "Chips and soda",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["chips", "soda"],
        qualityConcern: "Mostly packaged snack food and sugary drink after training.",
        suggestedImprovements: ["After training, swap toward protein plus carbs such as yogurt with granola, milk with a banana, or a rice bowl."],
        score: 3,
        subScores: scoreParts(3),
        createdAt: dateAt(-2, 18, 50)
      },
      {
        athleteId: sofia.id,
        loggedById: parent.id,
        mealType: MealType.BREAKFAST,
        mealWindow: MealWindow.MORNING,
        note: "Oatmeal, banana, milk and water before match day",
        displayTitle: "Oatmeal, banana, milk, and water",
        userDetails: "Nut-free breakfast before game day.",
        photoDescription: "Oatmeal with banana, milk, and water.",
        photoComponents: ["oatmeal", "banana", "milk", "water"],
        extractedDescription: "Oatmeal, banana, milk, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["oatmeal", "banana", "milk", "water"],
        suggestedImprovements: ["Good familiar match-day breakfast with carbs and fluids. Keep it familiar before kickoff."],
        score: 8,
        subScores: scoreParts(8),
        createdAt: dateAt(-1, 7, 30)
      },
      {
        athleteId: luca.id,
        loggedById: lucaUser.id,
        mealType: MealType.SNACK,
        mealWindow: MealWindow.TRAVEL,
        note: "Turkey wrap, apple, pretzels and water on the bus",
        displayTitle: "Turkey wrap, apple, pretzels, and water",
        userDetails: "Packed for away match travel.",
        photoDescription: "Wrap, apple, pretzels, and water bottle.",
        photoComponents: ["turkey wrap", "apple", "pretzels", "water"],
        extractedDescription: "Turkey wrap, apple, pretzels, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["turkey wrap", "apple", "pretzels", "water"],
        suggestedImprovements: ["Strong travel structure with portable carbs, protein, and fluids."],
        score: 8,
        subScores: scoreParts(8),
        createdAt: dateAt(-1, 10, 0)
      },
      {
        athleteId: leo.id,
        loggedById: staff.id,
        mealType: MealType.SNACK,
        mealWindow: MealWindow.PRE_TRAINING,
        note: "Apple slices and water before training",
        displayTitle: "Apple slices and water",
        userDetails: "Light snack before after-school session.",
        photoDescription: "Apple slices and water.",
        photoComponents: ["apple", "water"],
        extractedDescription: "Apple slices and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "medium",
        components: ["apple", "water"],
        suggestedImprovements: ["Good start, but add a bit more easy carbohydrate if training is longer or harder."],
        score: 6,
        subScores: scoreParts(6),
        createdAt: dateAt(-1, 15, 35)
      },
      {
        athleteId: ethan.id,
        loggedById: staff.id,
        mealType: MealType.DINNER,
        mealWindow: MealWindow.POST_TRAINING,
        note: "Chicken, rice, vegetables and water after practice",
        displayTitle: "Chicken, rice, vegetables, and water",
        userDetails: "Lactose-sensitive recovery dinner.",
        photoDescription: "Chicken, rice, vegetables, and water.",
        photoComponents: ["chicken", "rice", "vegetables", "water"],
        extractedDescription: "Chicken, rice, vegetables, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["chicken", "rice", "vegetables", "water"],
        suggestedImprovements: ["Strong recovery meal with protein, carbs, color, and fluids."],
        score: 9,
        subScores: scoreParts(9),
        createdAt: dateAt(-2, 19, 10)
      },
      {
        athleteId: ava.id,
        loggedById: staff.id,
        mealType: MealType.LUNCH,
        mealWindow: MealWindow.TRAVEL,
        note: "Tuna sandwich, orange, crackers and water",
        displayTitle: "Tuna sandwich, orange, crackers, and water",
        userDetails: "Packable lunch for tournament travel.",
        photoDescription: "Tuna sandwich, orange, crackers, and water.",
        photoComponents: ["tuna sandwich", "orange", "crackers", "water"],
        extractedDescription: "Tuna sandwich, orange, crackers, and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "high",
        components: ["tuna sandwich", "orange", "crackers", "water"],
        suggestedImprovements: ["Good travel option with protein, carbs, fruit, and fluids."],
        score: 8,
        subScores: scoreParts(8),
        createdAt: dateAt(-4, 11, 45)
      },
      {
        athleteId: grace.id,
        loggedById: staff.id,
        mealType: MealType.SNACK,
        mealWindow: MealWindow.PRE_TRAINING,
        note: "Granola bar and water before training",
        displayTitle: "Granola bar and water",
        userDetails: "Roster-only athlete, staff-entered context.",
        photoDescription: "Granola bar and water.",
        photoComponents: ["granola bar", "water"],
        extractedDescription: "Granola bar and water",
        interpretationSource: "seeded-photo",
        interpretationConfidence: "medium",
        components: ["granola bar", "water"],
        suggestedImprovements: ["Practical pre-training option. Add fruit if the session is longer or later in the day."],
        score: 7,
        subScores: scoreParts(7),
        createdAt: dateAt(-3, 16, 15)
      }
    ]
  });

  await prisma.fluidCheckIn.createMany({
    data: [
      { athleteId: maya.id, volumeOz: 18, urineColor: "Dark yellow", note: "After training", createdAt: dateAt(-4, 19, 30) },
      { athleteId: maya.id, volumeOz: 20, urineColor: "Yellow", note: "Morning", createdAt: dateAt(-3, 8, 0) },
      { athleteId: maya.id, volumeOz: 22, urineColor: "Yellow", note: "After school", createdAt: dateAt(-2, 15, 30) },
      { athleteId: maya.id, volumeOz: 24, urineColor: "Pale yellow", note: "Before training", createdAt: dateAt(-1, 16, 45) },
      { athleteId: maya.id, volumeOz: 20, urineColor: "Pale yellow", note: "Today", createdAt: dateAt(0, 8, 15) },
      { athleteId: noah.id, volumeOz: 12, urineColor: "Yellow", note: "Lunch", createdAt: dateAt(-4, 12, 30) },
      { athleteId: noah.id, volumeOz: 10, urineColor: "Dark yellow", note: "After training", createdAt: dateAt(-3, 18, 20) },
      { athleteId: noah.id, volumeOz: 12, urineColor: "Amber", note: "Morning", createdAt: dateAt(-2, 8, 5) },
      { athleteId: noah.id, volumeOz: 14, urineColor: "Dark yellow", note: "Before session", createdAt: dateAt(-1, 16, 20) },
      { athleteId: sofia.id, volumeOz: 16, urineColor: "Pale yellow", note: "Before practice", createdAt: dateAt(-2, 16, 0) },
      { athleteId: sofia.id, volumeOz: 18, urineColor: "Yellow", note: "After practice", createdAt: dateAt(-1, 18, 30) },
      { athleteId: luca.id, volumeOz: 18, urineColor: "Yellow", note: "School day", createdAt: dateAt(-2, 15, 0) },
      { athleteId: luca.id, volumeOz: 22, urineColor: "Pale yellow", note: "Before travel", createdAt: dateAt(-1, 9, 30) },
      { athleteId: leo.id, volumeOz: 10, urineColor: "Dark yellow", note: "After school", createdAt: dateAt(-1, 15, 15) },
      { athleteId: ethan.id, volumeOz: 18, urineColor: "Yellow", note: "After practice", createdAt: dateAt(-3, 18, 30) },
      { athleteId: ethan.id, volumeOz: 20, urineColor: "Yellow", note: "Today", createdAt: dateAt(0, 9, 0) }
    ]
  });

  const mayaBreakfast = mealLogs.find((meal) => meal.athleteId === maya.id && meal.mealType === MealType.BREAKFAST);

  await prisma.clubMeal.createMany({
    data: [
      {
        clubId: club.id,
        sourceMealId: mayaBreakfast?.id,
        sharedById: mayaUser.id,
        title: "Eggs, toast, kiwi and avocado",
        description: "Balanced breakfast with protein, toast and fruit. Useful before training when the toast and fruit carry the fuel and heavier fats stay moderate.",
        mealType: MealType.BREAKFAST,
        mealWindow: MealWindow.MORNING,
        dayTypeFit: [DayType.TRAINING, DayType.MATCH, DayType.RETURN_TO_PLAY],
        goalFit: ["recovery", "energy"],
        tags: ["breakfast", "pre-training", "home"],
        curatedCue: "Great pre-training breakfast",
        score: 9
      },
      {
        clubId: club.id,
        sharedById: admin.id,
        title: "Banana, granola bar and water",
        description: "Simple pre-training snack with easy carbs and fluid when warmup is close.",
        mealType: MealType.SNACK,
        mealWindow: MealWindow.PRE_TRAINING,
        dayTypeFit: [DayType.TRAINING, DayType.MATCH],
        goalFit: ["energy"],
        tags: ["pre-training", "snack", "packable"],
        curatedCue: "Strong pre-training option",
        score: 8
      },
      {
        clubId: club.id,
        sharedById: staff.id,
        title: "Chicken rice bowl with vegetables",
        description: "Simple post-training meal with lean protein plus rice to support muscle repair and refill energy stores.",
        mealType: MealType.DINNER,
        mealWindow: MealWindow.POST_TRAINING,
        dayTypeFit: [DayType.TRAINING, DayType.MATCH],
        goalFit: ["recovery", "lean mass"],
        tags: ["post-training", "dinner", "batch prep"],
        curatedCue: "Strong post-training meal",
        score: 9
      },
      {
        clubId: club.id,
        sharedById: staff.id,
        title: "Greek yogurt, granola and berries",
        description: "Packable recovery snack with protein and carbohydrate for the first hour after training.",
        mealType: MealType.SNACK,
        mealWindow: MealWindow.POST_TRAINING,
        dayTypeFit: [DayType.TRAINING, DayType.RETURN_TO_PLAY],
        goalFit: ["recovery"],
        tags: ["snack", "portable", "recovery"],
        curatedCue: "Helpful recovery snack",
        score: 8
      },
      {
        clubId: club.id,
        sharedById: staff.id,
        title: "Turkey wrap, banana and water",
        description: "Travel-friendly option with packable carbohydrate, protein and fluid when timing is tight.",
        mealType: MealType.LUNCH,
        mealWindow: MealWindow.TRAVEL,
        dayTypeFit: [DayType.TRAVEL, DayType.MATCH],
        goalFit: ["energy"],
        tags: ["travel", "lunch", "packable"],
        curatedCue: "Good travel-friendly option",
        score: 8
      },
      {
        clubId: club.id,
        sharedById: admin.id,
        title: "Oatmeal, banana, milk and water",
        description: "Familiar match-day breakfast with carbohydrate, some protein, and fluids.",
        mealType: MealType.BREAKFAST,
        mealWindow: MealWindow.MORNING,
        dayTypeFit: [DayType.MATCH, DayType.TRAINING],
        goalFit: ["energy"],
        tags: ["breakfast", "match day", "parent-packable"],
        curatedCue: "Strong match day breakfast",
        score: 8
      },
      {
        clubId: club.id,
        sharedById: admin.id,
        title: "Pasta, tomato sauce and grilled chicken",
        description: "Tournament-eve dinner with useful carbohydrate and protein without testing a new food.",
        mealType: MealType.DINNER,
        mealWindow: MealWindow.EVENING,
        dayTypeFit: [DayType.MATCH, DayType.TRAVEL],
        goalFit: ["energy", "recovery"],
        tags: ["dinner", "tournament", "family prep"],
        curatedCue: "Good tournament prep meal",
        score: 8
      },
      {
        clubId: club.id,
        sharedById: staff.id,
        title: "Hummus wrap, pretzels and fruit",
        description: "Vegetarian packable option with carbs, plant protein, and fruit for training days.",
        mealType: MealType.LUNCH,
        mealWindow: MealWindow.PRE_TRAINING,
        dayTypeFit: [DayType.TRAINING, DayType.TRAVEL],
        goalFit: ["energy", "vegetarian"],
        tags: ["vegetarian", "lunch", "packable"],
        curatedCue: "Good vegetarian option",
        score: 8
      },
      {
        clubId: club.id,
        sharedById: admin.id,
        title: "Bagel, peanut-free spread, banana and water",
        description: "Parent-packable carb-forward option for athletes who need nut-free snacks.",
        mealType: MealType.SNACK,
        mealWindow: MealWindow.PRE_TRAINING,
        dayTypeFit: [DayType.TRAINING, DayType.MATCH],
        goalFit: ["energy"],
        tags: ["nut-free", "parent-packable", "pre-training"],
        curatedCue: "Good parent-packable option",
        score: 8
      },
      {
        clubId: club.id,
        sharedById: staff.id,
        title: "Water bottle, orange slices and cheese crackers",
        description: "Light sideline option with fluids, easy carbs, and a small protein/fat anchor between games.",
        mealType: MealType.SNACK,
        mealWindow: MealWindow.TRAVEL,
        dayTypeFit: [DayType.MATCH, DayType.TRAVEL],
        goalFit: ["energy"],
        tags: ["sideline", "between games", "fluids"],
        curatedCue: "Helpful between-game option",
        score: 7
      }
    ]
  });

  console.log("Seeded EliteFuel demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
