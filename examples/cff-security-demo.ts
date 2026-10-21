interface Task {
  id: number;
  name: string;
  weight: number;
  done: boolean;
}

type TaskResult = {
  id: number;
  score: number;
  label: string;
};

class TaskRunner {
  private readonly tasks: Task[];
  private factor: number;

  constructor(tasks: Task[], factor: number) {
    this.tasks = tasks;
    this.factor = factor;
  }

  private weightOf(task: Task): number {
    switch (task.id % 3) {
      case 0:
        return task.weight * 2;
      case 1:
        return task.weight + 3;
      default:
        return task.weight;
    }
  }

  public run(): TaskResult[] {
    const results: TaskResult[] = [];
    for (const task of this.tasks) {
      let score = this.weightOf(task) * this.factor;
      try {
        if (!task.name) {
          throw new Error("empty name");
        }
        score += task.name.length;
      } catch (err) {
        score -= 5;
      } finally {
        score = Math.max(0, score);
      }
      results.push({
        id: task.id,
        score,
        label: `${task.name || "anonymous"}:${score}`,
      });
    }
    return results;
  }

  public async summarize(): Promise<string> {
    await Promise.resolve();
    const results = this.run();
    const total = results.reduce((sum, item) => sum + item.score, 0);
    const labels = results.map((item) => item.label).join("|");
    return `${labels}#${total}`;
  }

  public *chunks(size: number): Generator<Task[], void, void> {
    for (let i = 0; i < this.tasks.length; i += size) {
      yield this.tasks.slice(i, i + size);
    }
  }
}

const tasks: Task[] = [
  { id: 1, name: "alpha", weight: 4, done: false },
  { id: 2, name: "", weight: 7, done: true },
  { id: 3, name: "gamma", weight: 2, done: false },
  { id: 4, name: "delta", weight: 9, done: true },
];

async function main(): Promise<void> {
  const runner = new TaskRunner(tasks, 3);
  const results = runner.run();
  const summary = await runner.summarize();
  const chunkSizes: number[] = [];
  for (const chunk of runner.chunks(2)) {
    chunkSizes.push(chunk.length);
  }
  const output = { results, summary, chunkSizes };
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
});
