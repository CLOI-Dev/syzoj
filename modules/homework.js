let ProblemHomework = syzoj.model('problem_homework');
let Problem = syzoj.model('problem');
let JudgeState = syzoj.model('judge_state');
let ProblemTag = syzoj.model('problem_tag');
let User = syzoj.model('user');
let ProblemMission = syzoj.model('problem_mission');

app.get('/homework/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('teacher')) throw new ErrorMessage('您没有权限进行此操作。');

    let id = parseInt(req.params.id) || 0;
    let homework = await ProblemHomework.findById(id);
    if (!homework) {
      homework = await ProblemHomework.create();
      homework.id = id;
    }else{
      if(homework.teacher_id!=res.locals.user.id){
        throw new ErrorMessage('您没有权限进行此操作。');
      }
    }
    
    let problems = [];
    if (homework.problems) problems = await homework.problems.split('|').mapAsync(async id => await Problem.findById(id));

    let users = [];
    if (homework.users) users = await homework.users.split('|');

    let students = await res.locals.user.getStudents().map(async id => await User.findById(id));

    res.render('homework_edit', {
      homework: homework,
      problems: problems,
      users: users,
      students: students
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/homework/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('teacher')) throw new ErrorMessage('您没有权限进行此操作。');

    let id = parseInt(req.params.id) || 0;
    let homework = await ProblemHomework.findById(id);

    if (!homework) {
      homework = await ProblemHomework.create();
      homework.id = id;
    }else{
      if(homework.teacher_id!=res.locals.user.id){
        throw new ErrorMessage('您没有权限进行此操作。');
      }
    }
    if (!req.body.name.trim()) throw new ErrorMessage('作业名不能为空。');

    req.body.name = req.body.name.trim();

    homework.name = req.body.name;
    if (!Array.isArray(req.body.problems)) req.body.problems = [req.body.problems];
    homework.problems = req.body.problems.join('|');
    
    //[TODO] 布置作业时校验二次确认都为自己学生
    if (!Array.isArray(req.body.users)) req.body.users = [req.body.users];
    homework.users = req.body.users.join('|');
    
    homework.active = req.body.active;

    homework.teacher_id = res.locals.user.id;

    await homework.save();

    res.redirect(syzoj.utils.makeUrl(['teacher',res.locals.user.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/homework/:id', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登陆后继续！');

    const curUser = res.locals.user;
    let homework_id = parseInt(req.params.id);

    let homework = await ProblemHomework.findById(homework_id);
    if (!homework) throw new ErrorMessage('没有这个作业。');
    if( !homework.active && !(homework.teacher_id==curUser.id)) throw new ErrorMessage('这个作业已归档');

    let teacher = await User.findById(homework.teacher_id);

    let users = await homework.getUsers();
    if( (!teacher.hasStudent(curUser) || !(users.includes(curUser.id))) && !(homework.teacher_id==curUser.id)) throw new ErrorMessage('你没有权限访问这个作业。');

    let problems_id = await homework.getProblems();
    let problems = await problems_id.mapAsync(async id => await Problem.findById(id));
    await problems.forEachAsync(async problem => {
      problem.judge_state = await problem.getJudgeState(res.locals.user, true);
      problem.tags = await problem.getTags();
    });

    problems.sort(function(a, b){
      return a.id - b.id;
    });

    let students = await users.mapAsync(async id => await User.findById(id));
    let result = [];
    for(let student of students){
      result[student.id]=[];
      for(let problem of problems){
        result[student.id][problem.id]=await problem.getJudgeState(student, true);
      }
    }

    res.render('homework', {
      homework: homework,
      students: students,
      problems: problems,
      result: result
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/homework/mission/:id', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('teacher')) throw new ErrorMessage('您没有权限进行此操作。');

    const curUser = res.locals.user;
    let mission_id = parseInt(req.params.id);

    let mission = await ProblemMission.findById(mission_id);
    if (!mission) throw new ErrorMessage('无此试炼。');

    let problems_id = await mission.getProblems();
    let problems = await problems_id.mapAsync(async id => await Problem.findById(id));
    await problems.forEachAsync(async problem => {
      problem.judge_state = await problem.getJudgeState(res.locals.user, true);
      problem.tags = await problem.getTags();
    });

    let students = await res.locals.user.getStudents().map(async id => await User.findById(id));
    let result = [];
    for(let student of students){
      result[student.id]=[];
      for(let problem of problems){
        result[student.id][problem.id]=await problem.getJudgeState(student, true);
      }
    }

    res.render('homework_mission', {
      students: students,
      problems: problems,
      result: result
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});



