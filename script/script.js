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
	
	mentorGithubData.forEach(function(mentorData, index) {
		if (index) {
			const mentor = {
				fullName: mentorData[0].toLowerCase() + ' ' + mentorData[1].toLowerCase(),
				githubUsername: mentorData[4]
					.replace(/^.*:\/\/github\.com\//, '')
					.replace('/', '')
					.toLowerCase(),
				students: []
			};
			data.mentors.push(mentor);
		}
	})

	studentGithubData.forEach(function (studentData, index) {
		if (index) {
			data.mentors.forEach(function (mentorsData) {
				if (studentData[0].toLowerCase() === mentorsData.fullName) {
					mentorsData.students.push({ 
						github: String(studentData[1]).trim().toLowerCase(), 
						tasks: [] });
				}
			})
		}
	})
      
  const tasks = [];
	
	tasksListData.forEach(function (task, index) {
		if (index) {
			if (task[0] && task[2]) {
				const taskObj = {
					taskName: task[0],
					status: task[2].trim().toLowerCase()
				};
				tasks.push(taskObj);
			}
		}
	})

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
	
	mentorScoreData.forEach(function(score, index) {
		if(index) {
			const scoreObj = {
				task: String(score[3])
					.trim()
					.toLowerCase()
					.replace(/[^a-zA-Z\d\s:]|\s+/gm, ''),
				mentor: String(score[1])
					.trim()
					.replace(/^.*:\/\/github\.com\//, '')
					.replace('/', '')
					.toLowerCase(),
				student: score[2].trim()
					.replace(/^.*:\/\/github\.com\//, '')
					.replace('/', '')
					.replace('rolling-scopes-school', '')
					.replace(/-20\d{2}\w{1}\d{1}/, '')
					.toLowerCase()
			};
			scores.push(scoreObj);
		}
	})
  
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