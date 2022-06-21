import { EditorView } from "prosemirror-view";
import * as React from "react";
// import createAndInsertLink from "@shared/editor/commands/createAndInsertLink";
import { Dictionary } from "~/hooks/useDictionary";
import BodhiMentionEditor, { MentionSearchResult } from "./BodhiMentionEditor";
import BodhiMentionUserSelect from "./BodhiMentionUserSelect";

type Props = {
  isActive: boolean;
  view: EditorView;
  dictionary: Dictionary;
  search: string;
  results: MentionSearchResult[];
  // onClickBodhiMention: (
  //     event: React.MouseEvent<HTMLButtonElement>
  // ) => void;
  onShowToast: (message: string) => void;
  onClose: () => void;
};

function isActive(props: Props) {
  const { view } = props;
  const { selection } = view.state;

  try {
    const paragraph = view.domAtPos(selection.from);
    return props.isActive && !!paragraph.node;
  } catch (err) {
    return false;
  }
}

export default class BodhiMention extends React.Component<Props> {
  menuRef = React.createRef<HTMLDivElement>();

  state = {
    left: -1000,
    top: undefined,
  };

  componentDidMount() {
    window.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    window.removeEventListener("mousedown", this.handleClickOutside);
  }

  handleClickOutside = (event: Event) => {
    if (
      event.target instanceof HTMLElement &&
      this.menuRef.current &&
      this.menuRef.current.contains(event.target)
    ) {
      return;
    }
    console.log("click out side !!");
    this.props.onClose();
  };

  handleOnSelectLink = ({
    title,
    search,
  }: {
    title: string;
    search: string;
  }) => {
    const { view, onClose } = this.props;
    this.props.view.focus();

    const { dispatch, state } = view;
    const { from, to } = state.selection;
    dispatch(view.state.tr.insertText(title + " ", from - search.length, to));
    /** bodhi undo
     * 这里要提醒用户，是不是可以发邮件？ */
    onClose();
  };

  render() {
    const { ...rest } = this.props;
    const { selection } = this.props.view.state;
    const active = isActive(this.props);

    return (
      <BodhiMentionUserSelect ref={this.menuRef} active={active} {...rest}>
        {active && (
          <BodhiMentionEditor
            key={`${selection.from}-${selection.to}`}
            from={selection.from}
            to={selection.to}
            onSelectLink={this.handleOnSelectLink}
            {...rest}
          />
        )}
      </BodhiMentionUserSelect>
    );
  }
}
