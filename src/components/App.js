import { h } from "preact";
import { Router, Route } from "preact-router";

import TextEditor from "../routes/TextEditor";
import Redirect from "../routes/Redirect";
import { ContextProvider } from "../context";

import { v4 as uuidV4 } from "uuid";

const App = () => (
  <ContextProvider>
    <div id="app">
      <Router>
        <TextEditor path="/documents/:id" />
        <Redirect default to={`/documents/${uuidV4()}`} />
      </Router>
    </div>
  </ContextProvider>
);

export default App;
