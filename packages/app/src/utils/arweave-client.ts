import Arweave from "arweave";
import {
	Warp,
	LoggerFactory,
	WarpNodeFactory,
	WarpWebFactory
} from "warp-contracts";
import { arweaveLocalPort, isProd } from "@/env-config";

let arweave: Arweave;
export const getArweaveClient = (useLocal = false) => {
	if (!arweave) {
		arweave = Arweave.init(
			useLocal || arweaveLocalPort
				? {
						host: "127.0.0.1",
						port: arweaveLocalPort || 1984,
						protocol: "http"
				  }
				: {
						host: "arweave.net",
						port: 443,
						protocol: "https"
				  }
		);
	}
	return arweave;
};

let warp: Warp;
export const getWarp = () => {
	if (!arweave) {
		throw new Error("Arweave Client has not been instantiated");
	}
	if (!warp) {
		if (!isProd) {
			LoggerFactory.INST.logLevel("debug");
		}
		if (typeof window === "undefined") {
			warp = WarpNodeFactory.memCachedBased(arweave)
				.useWarpGateway({ confirmed: true })
				.build();
		} else {
			warp = WarpWebFactory.memCachedBased(arweave)
				.useWarpGateway({ confirmed: true })
				.build();
		}
	}

	return warp;
};
