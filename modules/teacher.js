let User = syzoj.model('user');
let UserPrivilege = syzoj.model('user_privilege');
let TeacherStudent = syzoj.model('teacher_student');
let ProblemHomework = syzoj.model('problem_homework');

app.get('/teacher/:id', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    let id = parseInt(req.params.id) || 0;
    let teacher = await User.findById(id);
    if( !( await teacher.hasPrivilege("teacher") ) )
      throw new ErrorMessage('该用户不是老师');
    if( !(await teacher.hasStudent(res.locals.user)) && teacher.id != res.locals.user.id  )
        throw new ErrorMessage('你不是该老师的学生');
    let sql = 'SELECT `id` FROM `user` WHERE `user`.`id` IN (SELECT `user_id` FROM `teacher_student` WHERE `teacher_id` = ' + teacher.id + ')';

    let users = await User.query(sql);
    
    users = await users.mapAsync(async user => {
      // query() returns plain objects.
      user = await User.findById(user.id);
      user.title = await user.student_title(teacher);
      return user;
    });

    let homeworks = await ProblemHomework.find({
      where: {
        teacher_id: id
      }
    });

    await homeworks.forEachAsync(async x => {
      x.users= await x.getUsers()
    });

    res.render('teacher', {
      teacher:teacher,
      users:users,
      homeworks:homeworks,
      curUser:res.locals.user
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/teacher/:id/join', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id) || 0;
    let teacher = await User.findById(id);
    if( !( await teacher.hasPrivilege("teacher") ) )
      throw new ErrorMessage('该用户不是老师');

    res.render('teacher_join_form', {
      teacher:teacher
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/teacher/:id/join', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id) || 0;
    let teacher = await User.findById(id);
    if( !( await teacher.hasPrivilege("teacher") ) )
      throw new ErrorMessage('该用户不是老师');
    if( await teacher.hasStudent(res.locals.user) )
      throw new ErrorMessage('已经是该老师的学生，不要重复申请');
    if( teacher.id == res.locals.user.id )
      throw new ErrorMessage('本人的理发技艺十分高超，誉满全城。我将为本城所有不给自己刮脸的人刮脸，我也只给这些人刮脸。我对各位表示热诚欢迎！');

    rel = await TeacherStudent.create();
    
    rel.title = req.body.title;
    rel.teacher_id = teacher.id;
    rel.user_id = res.locals.user.id;

    await rel.save();

    res.redirect(syzoj.utils.makeUrl(['teacher', teacher.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/teachers', async (req, res) => {
  try {  
    let a = await UserPrivilege.find();
    let users = {};
    for (let p of a) {
      if (!users[p.user_id]) {
        users[p.user_id] = {
          user: await User.findById(p.user_id),
          privileges: []
        };
      }
      users[p.user_id].privileges.push(p.privilege);
    }

    res.render('teachers', {
      users: Object.values(users)
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});
  
app.get('/teachers/my', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let sql = 'SELECT `id` FROM `user` WHERE `user`.`id` IN (SELECT `teacher_id` FROM `teacher_student` WHERE `user_id` = ' + res.locals.user.id + ')';

    let teachers = await User.query(sql);

    teachers = await teachers.mapAsync(async teacher => {
      // query() returns plain objects.
      teacher = await User.findById(teacher.id);
      return teacher;
    });
    res.render('teachers_my', {
      teachers:teachers
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});