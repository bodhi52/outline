import { Mark } from "prosemirror-model";
import { setTextSelection } from "prosemirror-utils";
import { EditorView } from "prosemirror-view";
import * as React from "react";
import styled from "styled-components";
import Avatar from "~/components/Avatar";
import Flex from "~/components/Flex";
import { Dictionary } from "~/hooks/useDictionary";
import { ToastOptions } from "~/types";
import BodhiMentionSearchResults from "./BodhiMentionSearchResult";
import Input from "./Input";

export type MentionSearchResult = {
  title: string;
  subtitle?: string;
  url: string;
};

type Props = {
  mark?: Mark;
  from: number;
  to: number;
  dictionary: Dictionary;
  search: string;
  results: MentionSearchResult[];
  onSelectLink: (options: { title?: string; search?: string }) => void;
  // onClickBodhiMention: (
  //     event: React.MouseEvent<HTMLButtonElement>
  // ) => void;
  onShowToast: (message: string, options: ToastOptions) => void;
  view: EditorView;
};

type State = {
  value: string;
  // previousValue: string;
  selectedIndex: number;
};

class BodhiMentionEditor extends React.Component<Props, State> {
  discardInputValue = false;
  initialValue = this.search;
  initialSelectionLength = this.props.to - this.props.from;

  state: State = {
    selectedIndex: -1,
    value: this.initialValue,
    // previousValue: "",
    // results: [],
  };

  get search(): string {
    return this.props.search;
  }

  componentWillUnmount = () => {
    if (this.discardInputValue) {
      return;
    }
    if (this.state.value === this.initialValue) {
      return;
    }
  };

  save = (title?: string): void => {
    const queryValue = this.state.value;
    this.props.onSelectLink({ title, search: queryValue });
    console.log(title);
  };

  onChange = (): void => {
    console.log("hello");
  };

  handleKeyDown = (event: React.KeyboardEvent): void => {
    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        if (this.initialSelectionLength) {
          this.moveSelectionToEnd();
        }
        return;
      }

      case "Escape": {
        event.preventDefault();
        if (this.initialValue) {
          this.setState({ value: this.initialValue }, this.moveSelectionToEnd);
        }
        return;
      }
      case "ArrowUp": {
        if (event.shiftKey) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const prevIndex = this.state.selectedIndex - 1;

        this.setState({
          selectedIndex: Math.max(-1, prevIndex),
        });
        return;
      }

      case "ArrowDown":
      case "Tab": {
        if (event.shiftKey) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        const { selectedIndex } = this.state;
        const results = this.props.results || [];
        const total = results.length;
        const nextIndex = selectedIndex + 1;

        this.setState({
          selectedIndex: Math.min(nextIndex, total),
        });
        return;
      }
    }
    return;
  };

  handleFocusLink = (selectedIndex: number) => {
    this.setState({ selectedIndex });
  };

  handleSelectLink = (title: string) => () => {
    this.save(title);
    if (this.initialSelectionLength) {
      this.moveSelectionToEnd();
    }
  };

  moveSelectionToEnd = () => {
    const { to, view } = this.props;
    const { state, dispatch } = view;
    dispatch(setTextSelection(to)(state.tr));
    view.focus();
  };

  render() {
    const { value, selectedIndex } = this.state;
    const results = this.props.results || [];
    const showResults = results.length > 0;

    return (
      <Wrapper>
        <Input value={value} onKeyDown={this.handleKeyDown} readOnly={true} />

        {showResults && (
          <MentionSearchResults id="link-search-results">
            {results.map((result: MentionSearchResult, index) => (
              <BodhiMentionSearchResults
                key={result.title}
                title={result.title}
                subtitle={result.subtitle}
                avatarUrl={
                  <Avatar key={result.title} src={result.url} size={32} />
                }
                onPointerMove={() => this.handleFocusLink(index)}
                onClick={this.handleSelectLink(result.title)}
                selected={index === selectedIndex}
              />
            ))}
          </MentionSearchResults>
        )}
      </Wrapper>
    );
  }
}

const Wrapper = styled(Flex)`
  margin-left: -8px;
  margin-right: -8px;
  min-width: 336px;
  pointer-events: all;
  gap: 8px;
`;

const MentionSearchResults = styled.ol`
  background: ${(props) => props.theme.toolbarBackground};
  position: absolute;
  top: 100%;
  width: 100%;
  height: auto;
  left: 0;
  padding: 0;
  margin: 0;
  margin-top: -3px;
  margin-bottom: 0;
  border-radius: 0 0 4px 4px;
  overflow-y: auto;
  overscroll-behavior: none;
  max-height: 260px;

  @media (hover: none) and (pointer: coarse) {
    position: fixed;
    top: auto;
    bottom: 40px;
    border-radius: 0;
    max-height: 50vh;
    padding: 8px 8px 4px;
  }
`;

export default BodhiMentionEditor;
