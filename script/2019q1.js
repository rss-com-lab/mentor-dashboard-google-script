function writeDataToFirebase() {
  const mainWB = SpreadsheetApp.openById(''); // An ID of the spreadsheet with mentor-student pairs

  const scoreData = mainWB.getSheets()[0].getDataRange().getValues();
  const pairsData = mainWB.getSheets()[1].getDataRange().getValues();
  const tasksData = mainWB.getSheets()[2].getDataRange().getValues();

  const data = {
    mentors: {},
    tasksStatus: {},
    taskCount: null
  };

  const mentorStudentPairs = {};
  const normalizedTaskPairs = {};
  const activeStudents = [];

  function normalizeString (string) {
    return string.trim()
        .replace(/(^.*:\/\/|.*)github\.com\//, '')
        .replace('https://', '')
        .replace('.github.io', '')
        .replace('/', '')
        .replace('rolling-scopes-school', '')
        .replace(/-20\d{2}\w{1}\d{1}/, '')
        .toLowerCase();
  }

  tasksData.forEach(function(row, index) {
    if (index > 0) {
      const taskName = row[0]
          .replace('-', '')
          .trim()
          .replace(/\$|\#|\[|\]|\/|\./gm, '');
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

  pairsData.forEach(function(row, index) {
    if (index > 0 && row[1] && row[0]) {
      const mentorID = normalizeString(row[1]);
      const studentID = normalizeString(row[0]);

      if (!data.mentors[mentorID]) {
        const mentor = {
          ID: mentorID,
          Github: 'https://github.com/' + mentorID,
          GithubLogin: mentorID,
          mentorStudents: {},
        };

        data.mentors[mentorID] = mentor;
      }

      const studentData = {
        mentorGithub: mentorID,
        studentGithub: 'https://github.com/' + studentID,
        studentName: studentID,
        tasks: {
          tasks: true,
        },
        prLinks: {
          prLinks: true,
        },
        studentStatus: 'active',
      };

      mentorStudentPairs[studentID] = mentorID;
      data.mentors[mentorID].mentorStudents[studentID] = studentData;
    }
  });

  scoreData.forEach(function(row, index) {
    if (index > 0) {
      const studentID = normalizeString(row[4]);
      const taskName = row[1].trim().toLowerCase().replace(/[^a-zA-Z\d\s:]|\s+/gm, '');
      const mentorObj = data.mentors[mentorStudentPairs[studentID]];
      const action = row[2];
      if (!mentorStudentPairs[studentID]) return;

      if (mentorObj.mentorStudents[studentID]
          && data.tasksStatus[normalizedTaskPairs[taskName]]
          && action !== 'Отчислить студента') {
        if (taskName && activeStudents.indexOf(studentID) === -1) {
          data.tasksStatus[normalizedTaskPairs[taskName]].taskCount += 1;
        }
        mentorObj.mentorStudents[studentID].tasks[row[1].replace(/\$|\#|\[|\]|\/|\./gm, '')] = row[6];
        mentorObj.mentorStudents[studentID].prLinks[row[1].replace(/\$|\#|\[|\]|\/|\./gm, '')] = row[5];

        if (activeStudents.indexOf(studentID) === -1) { activeStudents.push(studentID) }
      }

      if (action === 'Отчислить студента') {
        mentorObj.mentorStudents[studentID].studentStatus = 'dismissed';
        mentorObj.mentorStudents[studentID].reasonDismiss = row[7];
      }
    }
  });

  delete data.mentors['0'];

  data.taskCount = activeStudents.length;

  const firebaseURL = '';   // Firebase database URL
  const secret = '';    // Firebase database secret
  const base = FirebaseApp.getDatabaseByUrl(firebaseURL, secret);
  base.setData('2019Q1', data);
  base.setData('mentors', Object.keys(data.mentors));
}
