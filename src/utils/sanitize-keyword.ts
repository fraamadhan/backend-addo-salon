export const sanitizeKeyword = (keyword: string) => {
  const regexNoSpecialChars = /[^\w\s-]/gi;
  const regexDashReplace = /\s*-\s*/g;

  const isContainSpecialChars = regexNoSpecialChars.test(keyword);
  const isContainDash = regexDashReplace.test(keyword);

  const keywordOriginal = keyword;

  if (isContainDash || isContainSpecialChars) {
    keyword = keyword
      .replace(regexDashReplace, ' ')
      .replace(regexNoSpecialChars, '');
    keyword = keyword.replace(/  +/g, ' ');
    keyword = keyword.trim().toLowerCase();
  } else {
    keyword = keyword.replace(/  +/g, ' ');
    keyword.trim().toLowerCase();
  }

  return { keywordSanitized: keyword, keywordOriginal };
};
