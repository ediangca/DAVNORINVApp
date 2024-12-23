
export class Privilege {

    pid: number | null = null;
    ugid: number | null = null;
    mid: number | null = null;
    moduleName: string | null = null;
    isActive: boolean = false;
    c: boolean = false;
    r: boolean = false;
    u: boolean = false;
    d: boolean = false;
    post: boolean = false;
    unpost: boolean = false;


    constructor(
        pid: number | null = null,
        ugid: number | null = null,
        mid: number | null = null,
        moduleName: string | null = null,
        isActive: boolean = false,
        c: boolean = false,
        r: boolean = false,
        u: boolean = false,
        d: boolean = false,
        post: boolean = false,
        unpost: boolean = false
    ) {
        this.pid = pid;
        this.ugid = ugid;
        this.mid = mid;
        this.moduleName = moduleName;
        this.isActive = isActive;
        this.c = c;
        this.r = r;
        this.u = u;
        this.d = d;
        this.post = post
        this.unpost = unpost;
    }




}

