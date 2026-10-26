export namespace main {
	
	export class FileNode {
	    id: string;
	    name: string;
	    path: string;
	    isDirectory: boolean;
	    children?: FileNode[];
	    size?: number;
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isDirectory = source["isDirectory"];
	        this.children = this.convertValues(source["children"], FileNode);
	        this.size = source["size"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchResult {
	    path: string;
	    name: string;
	    lineNumber: number;
	    snippet: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.lineNumber = source["lineNumber"];
	        this.snippet = source["snippet"];
	    }
	}
	export class UpdateInfo {
	    hasUpdate: boolean;
	    currentVersion: string;
	    latestVersion: string;
	    releaseName: string;
	    releaseNotes: string;
	    assetUrl: string;
	    assetSize: number;
	    publishedAt: string;
	    htmlUrl: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hasUpdate = source["hasUpdate"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.releaseName = source["releaseName"];
	        this.releaseNotes = source["releaseNotes"];
	        this.assetUrl = source["assetUrl"];
	        this.assetSize = source["assetSize"];
	        this.publishedAt = source["publishedAt"];
	        this.htmlUrl = source["htmlUrl"];
	    }
	}

}

