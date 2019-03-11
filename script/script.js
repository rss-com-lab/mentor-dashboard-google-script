function writeDataToFirebase() {
	const FIREBASE_URL = '';
	const FIREBASE_DATABASE_SECRET = '';

	const MENTOR_STUDENT_PAIRS_SHEET_ID = '';
	const SCORE_SHEET_ID = '';
	const TASKS_SHEET_ID = '';
	
  const mentorStudentPairsWB = SpreadsheetApp.openById(MENTOR_STUDENT_PAIRS_SHEET_ID);
  const mentorScoreWB = SpreadsheetApp.openById(SCORE_SHEET_ID);
  const tasksListWB = SpreadsheetApp.openById(TASKS_SHEET_ID);
  
  const mentorGithub = mentorStudentPairsWB.getSheets()[1];
  const studentGithub = mentorStudentPairsWB.getSheets()[0];
  const tasksList = tasksListWB.getSheets()[0];
  const mentorScore = mentorScoreWB.getSheets()[0];
  
  const mentorGithubData = mentorGithub.getDataRange().getValues();
  const studentGithubData = studentGithub.getDataRange().getValues();
  const tasksListData = tasksList.getDataRange().getValues();
  const mentorScoreData = mentorScore.getDataRange().getValues();
  
  const data = {
    mentors: [],
    tasks: []
  }
  
  for(const i = 1; i < mentorGithubData.length; i++) {
    const mentor = {
      fullName: mentorGithubData[i][0].toLowerCase() + ' ' + mentorGithubData[i][1].toLowerCase(),
			githubUsername: mentorGithubData[i][4]
				.replace(/^.*:\/\/github\.com\//, '')
				.replace('/', '')
				.toLowerCase(),
      students: []
    };
    data.mentors.push(mentor);
  }
  
  for(const i = 1; i < studentGithubData.length; i++) {
    for (const j = 0; j < data.mentors.length; j++ ) {
      if (studentGithubData[i][0].toLowerCase() === data.mentors[j].fullName) {
        data.mentors[j].students.push({ 
          github: String(studentGithubData[i][1]).trim().toLowerCase(), 
          tasks: [] });
      }
    }
  }
  
  const tasks = [];
  
  for(const i = 1; i < tasksListData.length; i++) {
    if (tasksListData[i][0] && tasksListData[i][2]) {
      const taskObj = {
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
  
  const scores = [];
  
  for(const i = 1; i < mentorScoreData.length; i++) {
    const scoreObj = {
			task: String(mentorScoreData[i][3])
				.trim()
				.toLowerCase()
				.replace(/[^a-zA-Z\d\s:]|\s+/gm, ''),
			mentor: String(mentorScoreData[i][1])
				.trim()
				.replace(/^.*:\/\/github\.com\//, '')
				.replace('/', '')
				.toLowerCase(),
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
    const checkedTasks = {};

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
					if (checkedTasks[task.taskName.trim().toLowerCase().replace(/[^a-zA-Z\d\s:]|\s+/gm, '')]
					.students.indexOf(student.github) !== -1) {
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
    
  const base = FirebaseApp.getDatabaseByUrl(FIREBASE_URL, FIREBASE_DATABASE_SECRET);
  base.setData("JSONData", data);
}