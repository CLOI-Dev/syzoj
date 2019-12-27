import * as TypeORM from "typeorm";
import Model from "./common";

import User from "./user";

@TypeORM.Entity()
export default class TeacherStudent extends Model {
  static cache = true;

  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  teacher_id: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  user_id: number;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
  title: string;

  user?: User;
  teacher?: User;

  async loadRelationships() {
    this.user = await User.findById(this.user_id);
    this.teacher = await User.findById(this.teacher_id);
  }
}
