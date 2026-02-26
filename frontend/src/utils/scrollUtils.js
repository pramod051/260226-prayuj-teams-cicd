// Prayuj Teams - Scrolling Utilities

export const scrollToBottom = (element, behavior = 'smooth') => {
  if (element) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: behavior
    });
  }
};

export const scrollToTop = (element, behavior = 'smooth') => {
  if (element) {
    element.scrollTo({
      top: 0,
      behavior: behavior
    });
  }
};

export const scrollToElement = (element, targetElement, behavior = 'smooth') => {
  if (element && targetElement) {
    targetElement.scrollIntoView({
      behavior: behavior,
      block: 'nearest'
    });
  }
};

export const isScrolledToBottom = (element, threshold = 100) => {
  if (!element) return false;
  return element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;
};

export const isScrolledToTop = (element, threshold = 10) => {
  if (!element) return false;
  return element.scrollTop <= threshold;
};

// Auto-scroll hook for chat messages
export const useAutoScroll = (messagesRef, messages, shouldAutoScroll = true) => {
  const scrollToBottomIfNeeded = () => {
    if (!shouldAutoScroll || !messagesRef.current) return;
    
    const element = messagesRef.current;
    const wasAtBottom = isScrolledToBottom(element);
    
    if (wasAtBottom) {
      setTimeout(() => scrollToBottom(element), 100);
    }
  };

  return { scrollToBottomIfNeeded };
};
