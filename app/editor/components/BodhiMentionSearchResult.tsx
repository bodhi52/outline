import * as React from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import styled from "styled-components";
import Flex from "~/components/Flex";

type Props = React.HTMLAttributes<HTMLLIElement> & {
  avatarUrl: React.ReactNode;
  selected: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
};

function BodhiMentionSearchResult({
  title,
  subtitle,
  selected,
  avatarUrl,
  ...rest
}: Props) {
  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      if (selected && node) {
        scrollIntoView(node, {
          scrollMode: "if-needed",
          block: "center",
          boundary: (parent) => {
            return parent.id !== "link-search-results";
          },
        });
      }
    },
    [selected]
  );

  return (
    <ListItem ref={ref} compact={!subtitle} selected={selected} {...rest}>
      {avatarUrl && <Image>{avatarUrl}</Image>}
      <div>
        <Title>{title}</Title>
        {subtitle ? <Subtitle selected={selected}>{subtitle}</Subtitle> : null}
      </div>
    </ListItem>
  );
}

const ListItem = styled.li<{
  selected: boolean;
  compact: boolean;
}>`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  color: ${(props) => props.theme.toolbarItem};
  background: ${(props) =>
    props.selected ? props.theme.toolbarHoverBackground : "transparent"};
  font-family: ${(props) => props.theme.fontFamily};
  text-decoration: none;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  line-height: ${(props) => (props.compact ? "inherit" : "1.2")};
  height: ${(props) => (props.compact ? "28px" : "auto")};
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const Subtitle = styled.div<{
  selected: boolean;
}>`
  font-size: 13px;
  opacity: ${(props) => (props.selected ? 0.75 : 0.5)};
`;

const Image = styled(Flex)`
  padding: 0 8px 0 0;
  max-height: 32px;
  align-items: center;
  user-select: none;
  flex-shrink: 0;
  align-self: center;
  color: ${(props) => props.theme.text};
`;

export default BodhiMentionSearchResult;
