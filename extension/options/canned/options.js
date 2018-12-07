var __gcrExtAnswers = getAnswersListFromStorage();

var gcrExtEditorSaveAnswers = function() {
    localStorage.setItem("store.settings.cannedResponses", JSON.stringify(__gcrExtAnswers));
}

gcrExtEditorSetup();
gcrExtEditorUpdateAnswersList();
