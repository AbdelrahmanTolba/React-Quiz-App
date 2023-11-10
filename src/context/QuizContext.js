import { createContext, useContext, useEffect, useReducer } from "react";

const Quizcontext = createContext();

const SECS_PER_QUESTION = 30;
const intialState = {
  questions: [],

  // 'loading', "error", "ready", "active", "finished"
  status: "loading",
  index: 0,
  answer: null,
  points: 0,
  highScore: localStorage.getItem("highscore"),
  secondsRemaining: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "dataReceived":
      return { ...state, questions: action.payload, status: "ready" };
    case "dataFailed":
      return { ...state, status: "error" };
    case "start":
      return {
        ...state,
        status: "active",
        secondsRemaining: state.questions.length * SECS_PER_QUESTION,
      };
    case "newAnswer":
      const question = state.questions.at(state.index);
      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };
    case "nextQuestion":
      return { ...state, index: state.index + 1, answer: null };
    case "finish":
      const highestScore =
        state.points > state.highScore ? state.points : state.highScore;
      localStorage.setItem("highscore", JSON.stringify(highestScore));
      return {
        ...state,
        status: "finished",
        highScore: highestScore,
        answer: null,
      };
    case "restart":
      return {
        ...intialState,
        questions: state.questions,
        status: "ready",
        highScore: state.highScore,
      };
    case "tick":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finished" : state.status,
        highScore:
          state.points > state.highScore ? state.points : state.highScore,
      };
    default:
      throw new Error("Action Unknown");
  }
}
const URL = "http://localhost:9000/questions";

function QuizProvider({ children }) {
  const [
    { questions, status, index, answer, points, highScore, secondsRemaining },
    dispatch,
  ] = useReducer(reducer, intialState);
  const numQuestions = questions.length;
  const maxPoints = questions.reduce((prev, curr) => prev + curr.points, 0);
  useEffect(
    function () {
      fetch(URL)
        .then((res) => res.json())
        .then((data) => dispatch({ type: "dataReceived", payload: data }))
        .catch((err) => dispatch({ type: "dataFailed" }));
    },
    [dispatch]
  );

  return (
    <Quizcontext.Provider
      value={{
        questions,
        status,
        index,
        answer,
        points,
        highScore,
        secondsRemaining,
        numQuestions,
        maxPoints,
        dispatch,
      }}
    >
      {children}
    </Quizcontext.Provider>
  );
}
function useQuiz() {
  const context = useContext(Quizcontext);
  if (context === undefined)
    throw new Error("QuizContext is used outside of the quiz provider");
  return context;
}
export { QuizProvider, useQuiz };
