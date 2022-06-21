import { ResolvedPos } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import Extension from "../lib/Extension";
import { EventType } from "../types";

/**
 * An editor extension that adds commands to insert the current date and time.
 */
// const MAX_MATCH = 500;
// const OPEN_REGEX = /^(@|#)?$/;
// const CLOSE_REGEX = /(^(?!\/(@+)?)(.*)$|^\/(([@]+)\s.*|\s)$|^\/((@)+)$)/;

function getRegexp(
  mentionTrigger: string,
  hashtagTrigger: string,
  allowSpace: boolean
) {
  const mention = allowSpace
    ? new RegExp("(^|\\s)" + mentionTrigger + "([\\w-\\+]+\\s?[\\w-\\+]*)$")
    : new RegExp("(^|\\s)" + mentionTrigger + "([\\w-\\+]*)$");

  // hashtags should never allow spaces. I mean, what's the point of allowing spaces in hashtags?
  const tag = new RegExp("(^|\\s)" + hashtagTrigger + "([\\w-]*)$");

  return {
    mention: mention,
    tag: tag,
  };
}

function getMatch(
  $position: ResolvedPos<any>,
  opts: {
    mentionTrigger: any;
    hashtagTrigger: any;
    allowSpace: any;
    activeClass?: string;
    delay?: number;
  }
) {
  // take current para text content upto cursor start.
  // this makes the regex simpler and parsing the matches easier.
  // try {
  if ($position === null || $position === undefined) {
    return;
  }
  if (!$position) {
    return;
  }
  const parastart = $position.before();
  const text = $position.doc.textBetween(parastart, $position.pos, "\n", "\0");
  const regex = getRegexp(
    opts.mentionTrigger,
    opts.hashtagTrigger,
    opts.allowSpace
  );
  // only one of the below matches will be true.
  const mentionMatch = text.match(regex.mention);
  const tagMatch = text.match(regex.tag);
  const match = mentionMatch || tagMatch;
  // set type of match
  let type = "";
  if (mentionMatch) {
    type = "mention";
  } else if (tagMatch) {
    type = "tag";
  }
  // } catch (e) {
  //     console.log(e);
  //     return null;
  // }

  // if match found, return match with useful information.
  if (match) {
    if (match.index === undefined) {
      return;
    }
    // adjust match.index to remove the matched extra space
    match.index = match[0].startsWith(" ") ? match.index + 1 : match.index;
    match[0] = match[0].startsWith(" ")
      ? match[0].substring(1, match[0].length)
      : match[0];

    // The absolute position of the match in the document
    const from = $position.start() + match.index;
    const to = from + match[0].length;

    const queryText = match[2];
    // console.log("for queryText:" + queryText)

    return {
      range: { from: from, to: to },
      queryText: queryText,
      // queryText: match[0] + queryText,
      type: type,
    };
  }
  // else if no match don't return anything.
}

// export function run(
//   view: EditorView,
//   from: number,
//   to: number,
//   regex: RegExp,
//   handler: (
//     state: EditorState,
//     match: RegExpExecArray | null,
//     from?: number,
//     to?: number
//   ) => boolean | null
// ) {
//   if (view.composing) {
//     return false;
//   }
//   const state = view.state;
//   const $from = state.doc.resolve(from);
//   if ($from.parent.type.spec.code) {
//     return false;
//   }

//   const textBefore = $from.parent.textBetween(
//     Math.max(0, $from.parentOffset - MAX_MATCH),
//     $from.parentOffset,
//     undefined,
//     "\ufffc"
//   );

//   const match = regex.exec(textBefore);
//   const tr = handler(state, match, match ? from - match[0].length : from, to);
//   if (!tr) {
//     return false;
//   }
//   return true;
// }

export function getNewState() {
  return {
    active: false,
    range: {
      from: 0,
      to: 0,
    },
    type: "", // mention or tag
    text: "",
    suggestions: [],
    index: 0, // current active suggestion index
  };
}

const opts = {
  mentionTrigger: "@",
  hashtagTrigger: "#",
  allowSpace: false,
  activeClass: "suggestion-item-active",
  delay: 500,
};

export default class BodhiMention extends Extension {
  get name() {
    return "bodhi_mention";
  }

  get plugins() {
    const plugin = new PluginKey(this.name);
    return [
      new Plugin({
        key: plugin,
        state: {
          init() {
            return getNewState();
          },
          apply(tr) {
            const newState = getNewState();
            const selection = tr.selection;
            if (selection.from !== selection.to) {
              return newState;
            }
            const isTopLevel = selection.$from.depth === 1;
            if (!isTopLevel) {
              return;
            }
            const $position = selection.$from;
            const match = getMatch($position, opts);

            if (match) {
              newState.active = true;
              newState.range = match.range;
              newState.type = match.type;
              newState.text = match.queryText;
            }
            return newState;
          },
        },
        appendTransaction: (transactions, oldState, newState) => {
          const tr = newState.tr;
          const newstate2 = plugin.getState(newState);
          if (!newstate2) {
            return tr;
          }
          if (newstate2.text === "") {
            this.editor.events.emit(EventType.bodhiMentionMenuClose);
            return tr;
          }
          // if( newstate2.text.lastIndexOf(" ")
          this.editor.events.emit(EventType.bodhiMentionMenuOpen, {
            search: newstate2.text,
            collectionId: this.editor.props.id,
          });

          return tr;
        },
        props: {
          handleClick: () => {
            this.editor.events.emit(EventType.bodhiMentionMenuClose);
            return false;
          },
          handleKeyDown: (view, event) => {
            if (event.key === "@") {
              return false;
            }

            // this.editor.events.emit(EventType.bodhiMentionMenuOpen);
            console.log("@@@@@@@@@@this is in key down");
            console.log(event.key);
            if (event.key === "Escape" || event.key === "Enter") {
              this.editor.events.emit(EventType.bodhiMentionMenuClose);
              return false;
            }
            return false;
          },
          decorations: (state) => {
            const decorations: Decoration[] = [];
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  }
}
