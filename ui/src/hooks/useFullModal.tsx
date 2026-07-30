import { useState } from "react";

export const useFullModal = () => {
  const [showFullModal, setShowModal] = useState(false);
  const [fullModalContent, setModalContent] = useState<{ url?: string; title?: string } | null>(null);

  const handleOpenFullModal = (content: { url?: string; title?: string }) => {
    setModalContent(content);
    setShowModal(true);
  };

  const handleCloseFullModal = () => {
    setModalContent(null);
    setShowModal(false);
  };

  return {
    showFullModal,
    fullModalContent,
    handleOpenFullModal,
    handleCloseFullModal,
  };
};