let User = syzoj.model('user');
let Article = syzoj.model('article');
let Contest = syzoj.model('contest');
let Problem = syzoj.model('problem');
let Divine = require('syzoj-divine');
let fs = require('fs');
let TimeAgo = require('javascript-time-ago');
let zh = require('../libs/timeago');
TimeAgo.locale(zh);
const timeAgo = new TimeAgo('zh-CN');

app.get('/', async (req, res) => {
  try {
    let ranklist = await User.queryRange([1, syzoj.config.page.ranklist_index], { is_show: true }, {
      [syzoj.config.sorting.ranklist.field]: syzoj.config.sorting.ranklist.order
    });
    await ranklist.forEachAsync(async x => x.renderInformation());

    let schools = 
      (await User.createQueryBuilder()
        .select('school')
        .addSelect("COUNT(school)","count")
        .groupBy("school")
        .orderBy("count", "DESC")
      .getRawMany()).map(record => ({
        school:record.school,
        count:record.count}
      ));
    let notices = (await Article.find({
      where: { is_notice: true }, 
      order: { public_time: 'DESC' }
    })).map(article => ({
      title: article.title,
      url: syzoj.utils.makeUrl(['article', article.id]),
      date: syzoj.utils.formatDate(article.public_time, 'L')
    }));

    let fortune = null;
    if (res.locals.user) {
      fortune = Divine(res.locals.user.username, res.locals.user.sex);
    }

    let contests = await Contest.queryRange([1, 5], { is_public: true }, {
      start_time: 'DESC'
    });

    let problems = (await Problem.queryRange([1, 5], { is_public: true }, {
      publicize_time: 'DESC'
    })).map(problem => ({
      id: problem.id,
      title: problem.title,
      time: timeAgo.format(new Date(problem.publicize_time)),
    }));

    let codeforces = [];
    let codeforces_ori = fs.readFileSync('contest.list');
    try{
      codeforces_ori=await JSON.parse(codeforces_ori);
      for(let x of codeforces_ori['result']){
        if(x.phase=='BEFORE'){
          codeforces.push(x);
        }
      }
      await codeforces.sort(function(a,b){
        return a.startTimeSeconds-b.startTimeSeconds;
      });
    }catch(e){
      syzoj.log(e);
      codeforces = [];
    }
    res.render('index', {
      ranklist: ranklist,
      notices: notices,
      fortune: fortune,
      contests: contests,
      problems: problems,
      schools: schools,
      links: syzoj.config.links,
      codeforces: codeforces
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/help', async (req, res) => {
  try {
    res.render('help');
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
