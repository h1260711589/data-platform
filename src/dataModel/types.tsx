export type Student = {
    studentId: number;
    name: string;
    enrollYear: number;
    className: string;
    college?: string;
    extraCollegeType?: string;
    missInInfoTable?: boolean;
};

//单科考试
export type Exam = {
    examId: number;
    year: number;
    examName: string;
    examSubject: string;
};

//考试（一模、二模）
export type Test = {
    examName: string,
    year: number
}

export type Grade = {
    gradeId: number;
    studentId: number;
    examId: number;
    value: number;
};

export type ExamAndRank = {
    examId: number;
    year: number;
    examName: string;
    examSubject: string;
    rank: number
}

export enum SchoolType {
    Above211,
    ShangHaiGongBan,
    WaiDiGongBan,
    WaiDiMingBan,
    ShangHaiMingBan,
    ZhuanKe,
    Others,
    Empty,
}

export type School = {
    name: string;
    schoolType: SchoolType;
    city: string;
};

export type subject = '语文' | '数学' | '英语' | '政治' | '历史' | '地理' | '物理' | '化学' | '生物'