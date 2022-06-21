import { EditorView } from "prosemirror-view";
import * as React from "react";
import { Portal } from "react-portal";
import styled from "styled-components";
import { depths } from "@shared/styles";
import useComponentSize from "~/hooks/useComponentSize";
import useMediaQuery from "~/hooks/useMediaQuery";
import useViewportHeight from "~/hooks/useViewportHeight";

type Props = {
  active?: boolean;
  view: EditorView;
  children: React.ReactNode;
  forwardedRef?: React.RefObject<HTMLDivElement> | null;
};

const defaultPosition = {
  left: -1000,
  top: 0,
  offset: 0,
  visible: false,
};

function usePosition({
  menuRef,
  props,
}: {
  menuRef: React.RefObject<HTMLDivElement>;
  props: Props;
}) {
  const { view, active } = props;
  const { selection } = view.state;
  const { width: menuWidth, height: menuHeight } = useComponentSize(menuRef);
  const viewportHeight = useViewportHeight();
  const isTouchDevice = useMediaQuery("(hover: none) and (pointer: coarse)");

  if (!active || !menuWidth || !menuHeight || !menuRef.current) {
    return defaultPosition;
  }

  // If we're on a mobile device then stick the floating toolbar to the bottom
  // of the screen above the virtual keyboard.
  if (isTouchDevice && viewportHeight) {
    return {
      left: 0,
      right: 0,
      top: viewportHeight,
      offset: 0,
      visible: true,
    };
  }

  // based on the start and end of the selection calculate the position at
  // the center top
  let fromPos;
  let toPos;
  try {
    fromPos = view.coordsAtPos(selection.from);
    toPos = view.coordsAtPos(selection.to);
  } catch (err) {
    console.warn(err);
    return defaultPosition;
  }

  // ensure that start < end for the menu to be positioned correctly
  const selectionBounds = {
    top: Math.min(fromPos.top, toPos.top),
    bottom: Math.max(fromPos.bottom, toPos.bottom),
    left: Math.min(fromPos.left, toPos.left),
    right: Math.max(fromPos.right, toPos.right),
  };

  // calcluate the horizontal center of the selection
  const halfSelection =
    Math.abs(selectionBounds.right - selectionBounds.left) / 2;
  const centerOfSelection = selectionBounds.left + halfSelection;

  // position the menu so that it is centered over the selection except in
  // the cases where it would extend off the edge of the screen. In these
  // instances leave a margin
  const margin = 5;
  // const left = Math.min(
  //   window.innerWidth - menuWidth - margin,
  //   Math.max(margin, centerOfSelection - menuWidth / 2)
  // );
  // const left = Math.max(margin, centerOfSelection - menuWidth / 2);
  const left = Math.max(margin, centerOfSelection);
  // const top = Math.min(
  //   window.innerHeight - menuHeight - margin,
  //   Math.max(margin, selectionBounds.top - menuHeight)
  // );
  // const top = Math.max(margin, selectionBounds.top - menuHeight);
  const top = Math.max(margin, selectionBounds.bottom + margin);

  // if the menu has been offset to not extend offscreen then we should adjust
  // the position of the triangle underneath to correctly point to the center
  // of the selection still
  // const offset = left - (centerOfSelection - menuWidth / 2);
  const offset = left + menuWidth / 2;
  return {
    left: Math.round(left + window.scrollX),
    top: Math.round(top + window.scrollY),
    offset: Math.round(offset),
    visible: true,
  };
}

const BodhiMentionUserSelect = React.forwardRef(
  (props: Props, forwardedRef: React.RefObject<HTMLDivElement>) => {
    const menuRef = forwardedRef || React.createRef<HTMLDivElement>();

    const position = usePosition({
      menuRef,
      props,
    });

    return (
      <Portal>
        <Wrapper
          active={props.active && position.visible}
          ref={menuRef}
          offset={position.offset}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {props.children}
        </Wrapper>
      </Portal>
    );
  }
);

const Wrapper = styled.div<{
  active?: boolean;
  offset: number;
}>`
  will-change: opacity, transform;
  padding: 8px 16px;
  position: absolute;
  z-index: ${depths.editorToolbar};
  opacity: 0;
  background-color: ${(props) => props.theme.toolbarBackground};
  border-radius: 4px;
  transform: scale(0.95);
  transition: opacity 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition-delay: 150ms;
  line-height: 0;
  height: 40px;
  box-sizing: border-box;
  pointer-events: none;
  white-space: nowrap;
  * {
    box-sizing: border-box;
  }

  ${({ active }) =>
    active &&
    `
    transform: translateY(-6px) scale(1);
    opacity: 1;
  `};

  @media print {
    display: none;
  }

  @media (hover: none) and (pointer: coarse) {
    &:before {
      display: none;
    }

    transition: opacity 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform: scale(1);
    border-radius: 0;
    width: 100vw;
    position: fixed;
  }
`;

export default BodhiMentionUserSelect;
