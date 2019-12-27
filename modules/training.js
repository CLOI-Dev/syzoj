//add
let ProblemMission = syzoj.model('problem_mission');

app.get('/training', async (req, res) => {
  try {
    let query = ProblemMission.createQueryBuilder();

    let missions = await ProblemMission.queryAll(query);

    missions.sort(function(a, b){
      return a.idx - b.idx;
    });

    res.render('training', {
      allowedManageProblem: res.locals.user && await res.locals.user.hasPrivilege('manage_problem'),
      missions: missions
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/pretest', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    res.render('pretest', {
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
