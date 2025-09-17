interface ImageLoaderParams {
	src: string;
	width: number;
	quality?: number;
}

const CDN_URL = "https://zeke.hq";

export default function imageLoader({
	src,
	width,
	quality = 80,
}: ImageLoaderParams): string {
	if (src.startsWith("/_next")) {
		return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/https://app.zeke.hq${src}`;
	}
	return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
