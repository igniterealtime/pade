var defaultAnswers = [
  {
    name: 'Common: Welcome',
    description: "Hi there, how can I help you? :-)"
  },
  {
    name: 'Common: Pause',
    description: "I'm checking something, one moment, please."
  },
  {
    name: 'Common: Understanding',
    description: "I'm afraid I don't understand completely."
  },
  {
    name: 'Common: Misunderstanding',
    description: "I understand the problem and will be happy to help you. Let's see what I can do."
  },
  {
    name: 'Common: Angry',
    description: "I'm sorry you are having this problem. Let's see if there is anything we can do to help the situation."
  },
  {
    name: 'Common: Bye',
    description: "You are welcome, have a nice day :-)"
  }
];

var getAnswersListFromStorage  = function()
{
  // Load the answers from local storage.
  var localStorageKey = "store.settings.cannedResponses";
  var saved = localStorage.getItem(localStorageKey);
  var answers;

  if (!saved || saved === '') {
    localStorage.setItem(localStorageKey, JSON.stringify(defaultAnswers));
    answers = defaultAnswers;
  } else {
   answers = JSON.parse(localStorage.getItem(localStorageKey));
  }
  return answers;
}

