let ProblemMission = syzoj.model('problem_mission');
let Problem = syzoj.model('problem');
let JudgeState = syzoj.model('judge_state');
let ProblemTag = syzoj.model('problem_tag');
let User = syzoj.model('user');

app.get('/training/mission/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem')) throw new ErrorMessage('您没有权限进行此操作。');

    let id = parseInt(req.params.id) || 0;
    let mission = await ProblemMission.findById(id);
    if (!mission) {
      mission = await ProblemMission.create();
      mission.id = id;
    }
    
    let problems = [];
    if (mission.problems) problems = await mission.problems.split('|').mapAsync(async id => await Problem.findById(id));

    res.render('training_mission_edit', {
      mission: mission,
      problems: problems
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/training/mission/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem')) throw new ErrorMessage('您没有权限进行此操作。');

    let id = parseInt(req.params.id) || 0;
    let mission = await ProblemMission.findById(id);

    if (!mission) {
      mission = await ProblemMission.create();
      mission.id = id;
    }

    if (!req.body.name.trim()) throw new ErrorMessage('人物名不能为空。');
    req.body.name = req.body.name.trim();
    if (mission.name !== req.body.name) {
      if (await ProblemMission.findOne({ where: { name: req.body.name } })) {
        throw new ErrorMessage('任务名称已被使用。');
      }
    }

    mission.name = req.body.name;
    mission.level = req.body.level;
    mission.description = req.body.description;
    mission.idx = req.body.idx;
    mission.name = req.body.name;
    mission.img_url = req.body.img_url;
    if (!Array.isArray(req.body.problems)) req.body.problems = [req.body.problems];
    mission.problems = req.body.problems.join('|');
    
    await mission.save();

    res.redirect(syzoj.utils.makeUrl(['training','mission',mission.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/training/mission/:id', async (req, res) => {
  try {
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

    res.render('training_mission', {
      mission: mission,
      problems: problems,
      allowedManageProblem: res.locals.user && await res.locals.user.hasPrivilege('manage_problem')
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/training/mission/:id/edit_sort', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem')) throw new ErrorMessage('您没有权限进行此操作。');

    let id = parseInt(req.params.id) || 0;
    let mission = await ProblemMission.findById(id);
    
    if (!mission) { 
      throw new ErrorMessage('没有题目咋排序啊');
    }   
    
    let problems = [];
    if (mission.problems) problems = await mission.problems.split('|').mapAsync(async id => await Problem.findById(id));
    else throw new ErrorMessage('没有题目咋排序啊');

    res.render('training_mission_edit_sort', {
      mission: mission,
      problems: problems
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/training/mission/:id/edit_sort', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem')) throw new ErrorMessage('您没有权限进行此操作。');

    let id = parseInt(req.params.id) || 0;
    let mission = await ProblemMission.findById(id);

    if (!mission) {
      throw new ErrorMessage('没有题目咋排序啊');
    }

    if (!Array.isArray(req.body.problems)) req.body.problems = [req.body.problems];
    mission.problems = req.body.problems.join('|');
    
    await mission.save();

    res.redirect(syzoj.utils.makeUrl(['training','mission',id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});


