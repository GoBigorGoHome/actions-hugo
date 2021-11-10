export default function getURL(
  os: string,
  arch: string,
  extended: string,
  version: string
): string {
  const extendedStr = (extended: string): string => {
    if (extended === 'true') {
      return 'extended_';
    } else {
      return '';
      // } else {
      //   throw new Error(`Invalid input (extended): ${extended}`);
    }
  };

  const ext = (os: string): string => {
    if (os === 'Windows') {
      return 'zip';
    } else {
      return 'tar.gz';
    }
  };

  const hugoName = `hugo_${extendedStr(extended)}${version}_${os}-${arch}`;
  const baseURL = 'https://github.com/gohugoio/hugo/releases/download';
  const url = `${baseURL}/v${version}/${hugoName}.${ext(os)}`;

  return url;
}

export function getPandocURL(
  os: string,
  arch: string,
  version: string
): string {
  const ext = (os: string): string => {
    if (os === 'Windows') {
      return 'zip';
    } else {
      return 'tar.gz';
    }
  };

  const pandocName = `pandoc-${version}-${os}-${arch}`;
  const baseURL = 'https://github.com/jgm/pandoc/releases/download';
  const url = `${baseURL}/${version}/${pandocName}.${ext(os)}`;
  return url;
}
