function writeDataToFirebase() {
  const mentorStudentPairsWB = SpreadsheetApp.openById('');   // An ID of the spreadsheet with mentor-student pairs
  const mentorScoreWB = SpreadsheetApp.openById('');    // An ID of the spreadsheet with Score data
  const tasksListWB = SpreadsheetApp.openById('');    // An ID of the spreadsheet with the task list
  
  const mentorGithub = mentorStudentPairsWB.getSheets()[1];
  const studentGithub = mentorStudentPairsWB.getSheets()[0];
  const tasksList = tasksListWB.getSheets()[0];
  const mentorScore = mentorScoreWB.getSheets()[0];
  
  const mentorGithubData = mentorGithub.getDataRange().getValues();
  const studentGithubData = studentGithub.getDataRange().getValues();
  const tasksListData = tasksList.getDataRange().getValues();
  const mentorScoreData = mentorScore.getDataRange().getValues();
  
  const data = {
    mentors: {},
    tasksStatus: {},
    taskCount: null
  }
  
  const pairs = {};
  const mentorStudentPairs = {};
  const normalizedTaskPairs = {};
  const activeStudents = [];
  
  function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
  };
  
  function normalizeString (string) {
    return string.trim()
        .replace(/^.*:\/\/github\.com\//, '')
        .replace('/', '')
        .replace('rolling-scopes-school', '')
        .replace(/-20\d{2}\w{1}\d{1}/, '')
        .toLowerCase();
  };
  
  tasksListData.forEach(function(row, index) {
    if (index > 0) {
      const taskName = row[0].replace('-', '').trim().replace(/\$|\#|\[|\]|\/|\./gm, '');
      const taskLink = row[1];
      const taskStatus = row[2];
    
      const task = {
        taskName: taskName,
        taskStatus: taskStatus,
        taskLink: taskLink,
        taskCount: 0
      };
    
      data.tasksStatus[taskName] = task;
      
      normalizedTaskPairs[taskName.trim().toLowerCase().replace(/[^a-zA-Z\d\s:]|\s+/gm, '')] = taskName;
    }
  });
  
  mentorGithubData.forEach(function(row, index) {
    if (index > 0) {
      pairs[row[0] + ' ' + row[1]] = normalizeString(row[4]);
      
      const mentor = {
        name: row[0],
        Surname: row[1],
        ID: row[0] + ' ' + row[1],
        Github: row[4],
        GithubLogin: normalizeString(row[4]),
        mentorStudents: {},
      };
    
      data.mentors[normalizeString(row[4])] = mentor;
    }
  });
  
  studentGithubData.forEach(function (row, index) {
    if (index > 0) {
      const mentorID = pairs[row[0]];
      const studentID = row[1];
      const mentorObj = data.mentors[mentorID];
      
      const studentData = {
        mentorGithub: mentorID,
        studentGithub: 'https://github.com/' + row[1],
        studentName: studentID,
        tasks: {},
        prLinks: {},
      }
    
      mentorStudentPairs[studentID] = mentorID;
      mentorObj.mentorStudents[studentID] = studentData;
    }
  });

  mentorScoreData.forEach(function(row, index) {
    if (index > 0) {
      const studentID = normalizeString(row[2]);
      const taskName = row[3].trim().toLowerCase().replace(/[^a-zA-Z\d\s:]|\s+/gm, '');
      const mentorObj = data.mentors[mentorStudentPairs[studentID]];
      if (!mentorStudentPairs[studentID]) return;

      if (mentorObj.mentorStudents[studentID]) {
        data.tasksStatus[normalizedTaskPairs[taskName]].taskCount += 1;
        mentorObj.mentorStudents[studentID].tasks[row[3].replace(/\$|\#|\[|\]|\/|\./gm, '')] = row[5];
        mentorObj.mentorStudents[studentID].prLinks[row[3].replace(/\$|\#|\[|\]|\/|\./gm, '')] = row[4];
        
        if (activeStudents.indexOf(studentID) === -1) {activeStudents.push(studentID)};
      }
    }
  });
  
  const mentors = Object.keys(data.mentors);
  
  mentors.forEach(function (mentor) {
    const students = Object.keys(data.mentors[mentor].mentorStudents);
    
    students.forEach(function (student){
      if (isEmpty(data.mentors[mentor].mentorStudents[student].tasks)) {
        delete data.mentors[mentor].mentorStudents[student];
      }
    });
  });
  
  data.taskCount = activeStudents.length;
  
  const firebaseURL = '';   // Firebase database URL
  const secret = '';    // Firebase database secret
  const base = FirebaseApp.getDatabaseByUrl(firebaseURL, secret);
  base.setData('JSONData', data);
}