export function generateTask(previousTask, mode = "mixed") {
  let types = [];

  if (mode === "mixed") {
    types = ["addition", "missing", "subtraction", "addition_gap", "subtraction_gap"];
  } else if (mode === "verliebte") {
    types = ["missing"];
  } else if (mode === "addition_gap") {
    types = ["addition_gap"];
  } else if (mode === "subtraction_gap") {
    types = ["subtraction_gap"];
  } else {
    types = [mode];
  }

  let newTask;
  let attempts = 0;

  do {
    const typeKey = types[Math.floor(Math.random() * types.length)];
    let type = typeKey;
    let isGap = false;

    if (typeKey === "addition_gap") {
      type = "addition";
      isGap = true;
    }
    if (typeKey === "subtraction_gap") {
      type = "subtraction";
      isGap = true;
    }

    let num1;
    let num2;
    let solution;
    let gapIndex = 2;

    if (type === "addition") {
      const sum = Math.floor(Math.random() * 9) + 2;
      num1 = Math.floor(Math.random() * (sum - 1)) + 1;
      num2 = sum - num1;
      solution = sum;

      if (isGap) {
        gapIndex = Math.random() < 0.5 ? 0 : 1;
        solution = gapIndex === 0 ? num1 : num2;
      }
    } else if (type === "subtraction") {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      solution = num1 - num2;

      if (isGap) {
        gapIndex = Math.random() < 0.5 ? 0 : 1;
        solution = gapIndex === 0 ? num1 : num2;
      }
    } else {
      num1 = Math.floor(Math.random() * 11);
      num2 = null;
      solution = 10 - num1;
      gapIndex = 1;
      type = "missing";
    }

    newTask = { num1, num2, solution, type, gapIndex, id: Math.random() };
    attempts += 1;
  } while (
    previousTask &&
    previousTask.num1 === newTask.num1 &&
    previousTask.num2 === newTask.num2 &&
    previousTask.type === newTask.type &&
    previousTask.gapIndex === newTask.gapIndex &&
    attempts < 10
  );

  return newTask;
}
