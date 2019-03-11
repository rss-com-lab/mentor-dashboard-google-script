function writeDataToFirebase() {
  var mentorStudentPairsWB = SpreadsheetApp.openById("{{MENTOR_STUDENT_PAIRS}}");
  var mentorScoreWB = SpreadsheetApp.openById("{{SCORE}}");
  var tasksListWB = SpreadsheetApp.openById("{{TASKS}}");
  
  var mentorGithub = mentorStudentPairsWB.getSheets()[1];
  var studentGithub = mentorStudentPairsWB.getSheets()[0];
  var tasksList = tasksListWB.getSheets()[0];
  var mentorScore = mentorScoreWB.getSheets()[0];
  
  var mentorGithubData = mentorGithub.getDataRange().getValues();
  var studentGithubData = studentGithub.getDataRange().getValues();
  var tasksListData = tasksList.getDataRange().getValues();
  var mentorScoreData = mentorScore.getDataRange().getValues();
  
  var data = {
    mentors: [],
    tasks: []
  }
  
  for(var i = 1; i < mentorGithubData.length; i++) {
    var mentor = {
      fullName: mentorGithubData[i][0].toLowerCase() + ' ' + mentorGithubData[i][1].toLowerCase(),
      githubUsername: mentorGithubData[i][4].replace(/^.*:\/\/github\.com\//, '').replace('/', '').toLowerCase(),
      students: []
    };
    data.mentors.push(mentor);
  }
  
  for(var i = 1; i < studentGithubData.length; i++) {
    for (var j = 0; j < data.mentors.length; j++ ) {
      if (studentGithubData[i][0].toLowerCase() === data.mentors[j].fullName) {
        data.mentors[j].students.push({ 
          github: String(studentGithubData[i][1]).trim().toLowerCase(), 
          tasks: [] });
      }
    }
  }
  
  var tasks = [];
  
  for(var i = 1; i < tasksListData.length; i++) {
    if (tasksListData[i][0] && tasksListData[i][2]) {
      var taskObj = {
        taskName: tasksListData[i][0],
        status: tasksListData[i][2].trim().toLowerCase()
      };
      tasks.push(taskObj);
    }
  };
  
  
  function mergeTasksAndMainDataObject(tasksArray, mainDataObj) {
    tasksArray.forEach(function(task) {
      mainDataObj.tasks.push(task);
    });

    mainDataObj.mentors.forEach(function(mentor) {
      mentor.students.forEach(function(student) {
        mainDataObj.tasks.forEach(function(task) {
          student.tasks.push({
            taskName: task.taskName,
            status: null,
          });
        });
      });
    });
  };

  mergeTasksAndMainDataObject(tasks, data);
  
  var scores = [];
  
  for(var i = 1; i < mentorScoreData.length; i++) {
    var scoreObj = {
      task: String(mentorScoreData[i][3]).trim().toLowerCase().replace(/[^a-zA-Z\d\s:]|\s+/gm, ''),
      mentor: String(mentorScoreData[i][1]).trim().replace(/^.*:\/\/github\.com\//, '').replace('/', '').toLowerCase(),
      student: mentorScoreData[i][2].trim()
        .replace(/^.*:\/\/github\.com\//, '')
        .replace('/', '')
        .replace('rolling-scopes-school', '')
        .replace(/-20\d{2}\w{1}\d{1}/, '')
        .toLowerCase()
    };
    scores.push(scoreObj);
  };
  
  function addTaskStatus(taskArr, scoreArr, mainDataObj) {
    var checkedTasks = {};

    taskArr.forEach(function(task) {
      checkedTasks[task.taskName.trim().toLowerCase().replace(/[^a-zA-Z\d\s:]|\s+/gm, '')] = {
        students: [],
        mentors: [],
      };
    });

    scoreArr.forEach(function(item) {
      if (!checkedTasks[item.task]) {
        checkedTasks[item.task] = { students: [], mentors: [] };
      }
      checkedTasks[item.task].students.push(item.student);
      checkedTasks[item.task].mentors.push(item.mentor);
    });

    mainDataObj.mentors.forEach(function(mentor) {
      mentor.students.forEach(function(student) {
        student.tasks.forEach(function(task) {
          if (checkedTasks[task.taskName.trim().toLowerCase().replace(/[^a-zA-Z\d\s:]|\s+/gm, '')].students.indexOf(student.github) !== -1) {
            Object.defineProperties(task, {
              status: {
                value: 'checked',
              },
            });
          }
        });
      });
    });
  };

  addTaskStatus(tasks, scores, data);
    
  var firebaseUrl = "{{FIREBASE_URL}}";
  var secret = "{{DATABASE_SECRET}}";
  var base = FirebaseApp.getDatabaseByUrl(firebaseUrl, secret);
  base.setData("JSONData", data);
}