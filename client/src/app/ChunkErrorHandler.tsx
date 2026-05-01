"use client";

import { useEffect } from "react";

const RELOAD_KEY = "podnit-chunk-reload";

const isChunkError = (value: unknown): boolean => {
	const message = String(value ?? "").toLowerCase();
	return message.includes("chunkloaderror") || message.includes("loading chunk") || message.includes("failed to fetch dynamically imported module") || message.includes("returnnan is not defined");
};

export default function ChunkErrorHandler() {
	useEffect(() => {
		const reloadForChunkError = async (reason: unknown) => {
			if (!isChunkError(reason)) {
				return;
			}

			const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
			if (alreadyReloaded) {
				sessionStorage.removeItem(RELOAD_KEY);
				return;
			}

			sessionStorage.setItem(RELOAD_KEY, "1");

			try {
				if ("caches" in window) {
					const cacheKeys = await caches.keys();
					await Promise.all(cacheKeys.map((key) => caches.delete(key)));
				}
			} catch {
				// Ignore cache clearing failures and continue with reload.
			}

			const url = new URL(window.location.href);
			url.searchParams.set("_chunk_reload", Date.now().toString());
			window.location.replace(url.toString());
		};

		const onError = (event: ErrorEvent) => {
			void reloadForChunkError(event.error || event.message);
		};
		const onRejection = (event: PromiseRejectionEvent) => {
			void reloadForChunkError(event.reason);
		};

		window.addEventListener("error", onError);
		window.addEventListener("unhandledrejection", onRejection);

		return () => {
			window.removeEventListener("error", onError);
			window.removeEventListener("unhandledrejection", onRejection);
		};
	}, []);

	return null;
}
