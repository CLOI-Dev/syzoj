import * as TypeORM from "typeorm";
import Model from "./common";

declare var syzoj, ErrorMessage: any;

import User from "./user";
import Problem from "./problem";
import ContestRanklist from "./contest_ranklist";
import ContestPlayer from "./contest_player";

@TypeORM.Entity()
export default class ProblemMission extends Model {
  static cache = true;

  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Index({ unique: true })
  @TypeORM.Column({ nullable: true, type: "varchar", length: 255 })
  name: string;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 255 })
  level: string;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 255 })
  description: string;

  @TypeORM.Column({ nullable: true, type: "integer"})
  idx: number;
  
  @TypeORM.Column({ nullable: true, type: "varchar", length: 255 })
  img_url: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  problems: string;

  async getProblems() {
    if (!this.problems) return [];
    return this.problems.split('|').map(x => parseInt(x));
  }
  
  async setProblemsNoCheck(problemIDs) {
    this.problems = problemIDs.join('|');
  }
  
  async setProblems(s) {
    let a = [];
    await s.split('|').forEachAsync(async x => {
      let problem = await Problem.findById(x);
      if (!problem) return;
      a.push(x);
    });
    this.problems = a.join('|');
  }

}
