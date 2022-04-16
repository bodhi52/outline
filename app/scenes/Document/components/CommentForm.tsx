import * as React from "react";
import { useTranslation } from "react-i18next";
import { MAX_COMMENT_LENGTH } from "@shared/constants";
import Comment from "~/models/Comment";
import Avatar from "~/components/Avatar";
import Flex from "~/components/Flex";
import useCurrentUser from "~/hooks/useCurrentUser";
import usePersistedState from "~/hooks/usePersistedState";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import CommentEditor from "./CommentEditor";

type Props = {
  documentId: string;
  thread: Comment;
  onTyping: () => void;
};

function CommentForm({ documentId, thread, onTyping }: Props) {
  const [data, setData] = usePersistedState(
    `draft-${documentId}-${thread.id}`,
    undefined
  );
  const formRef = React.useRef<HTMLFormElement>(null);
  const [forceRender, setForceRender] = React.useState(0);
  const { t } = useTranslation();
  const { showToast } = useToasts();
  const { comments } = useStores();
  const user = useCurrentUser();

  const handleCreateComment = async (event: React.FormEvent) => {
    event.preventDefault();

    const comment = comments.get(thread.id);
    if (comment) {
      setData(undefined);
      setForceRender((s) => ++s);

      try {
        await comment.save({
          documentId: documentId,
          data,
        });
      } catch (error) {
        showToast(t("Error creating comment"), { type: "error" });
      }
    }
  };

  const handleCreateReply = async (event: React.FormEvent) => {
    event.preventDefault();

    setData(undefined);
    setForceRender((s) => ++s);

    try {
      await comments.save({
        parentCommentId: thread?.id,
        documentId: documentId,
        data,
      });
    } catch (error) {
      showToast(t("Error creating comment"), { type: "error" });
    }
  };

  const handleChange = (value: (asString: boolean) => string) => {
    setData(value(false));
    onTyping();
  };

  const handleSave = () => {
    formRef.current?.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true })
    );
  };

  return (
    <form
      ref={formRef}
      onSubmit={thread?.isNew ? handleCreateComment : handleCreateReply}
    >
      <Flex gap={8}>
        <Avatar src={user.avatarUrl} />
        <CommentEditor
          key={`${forceRender}`}
          onChange={handleChange}
          onSave={handleSave}
          maxLength={MAX_COMMENT_LENGTH}
          autoFocus={thread.isNew}
          placeholder={
            thread.isNew ? `${t("Add a comment")}…` : `${t("Add a reply")}…`
          }
        />
      </Flex>
    </form>
  );
}

export default React.forwardRef(CommentForm);
