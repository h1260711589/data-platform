import React, { useState, useEffect, useCallback } from 'react'
import { Student, Exam, Grade, ExamAndRank, Test, subject } from './types'
import { getJson } from '@/loader'
import { groupBy, orderBy, findIndex, forEach, compact, sortBy } from 'lodash'
import { createModel } from 'hox'

export const useDataModel = createModel(() => {
    const [students, setStudents] = useState<Student[]>([])
    const [exams, setExams] = useState<Exam[]>([])
    const [grades, setGrades] = useState<Grade[]>([])
    const [enrollYear, setEnrollYear] = useState<number[]>([])

    useEffect(() => {
        //请求数据
        const { students: _students, exams: _exams, grades: _grades } = getJson()
        setStudents(_students)
        setExams(_exams)
        setGrades(_grades)
        setEnrollYear(Object.keys(groupBy(_students, 'enrollYear')).map(year => Number(year)))
    }, [])



    const getStudentInfo = useCallback((studentId: number): Student | undefined => {

        return students.find((stu) => {
            if (stu.studentId === studentId)
                return true
            else
                return false
        })
    }, [students])

    const getStudentsByYear = useCallback((Year: number): Student[] => {
        return students.filter((student) => {
            return student.enrollYear === Year
        })
    }, [students])

    //得到某一年的所有单科考试
    const getExamsByYear = useCallback((enrollYear: number): Exam[] => {
        const res = groupBy(exams, 'year')[enrollYear]
        if (res)
            return res
        return []
    }, [enrollYear])

    //得到某一年的所有整场考试
    const getTestsByYear = useCallback((enrollYear: number): Test[] => {
        return Object.keys(groupBy(getExamsByYear(enrollYear), 'examName')).map(examName => { return { examName, year: enrollYear } })
    }, [getExamsByYear, enrollYear])

    const getExamByExamId = useCallback((examId: number): Exam | undefined => {
        return exams.find((exam) => {
            if (exam.examId === examId)
                return true
            else
                return false
        })
    }, [exams])

    //计算studentId在examId的排名,若examId无效或studentId无效返回undefined
    const getExamRank = useCallback((examId: number, studentId: number): { rank: number, rankPercent: number } | undefined => {
        const arr = groupBy(grades, 'examId')[examId]
        if (!arr)
            return undefined
        const arrOrdered = orderBy(arr, (grade) => {
            return grade.value
        }, ['desc'])
        const rank = findIndex(arrOrdered, (grade) => {
            if (grade.studentId === studentId)
                return true
            else
                return false
        }) + 1
        if (rank === 0)
            return undefined
        const rankPercent = rank / arr.length
        return { rank, rankPercent }
    }, [grades])

    //计算某次test中某几科总分的排名名单,考试名不存在或该考试无对应科目返回undefined
    const getTestRankWithSubjects = useCallback((testName: string, subjects: subject[]): Record<
        string, {
            value: number,
            rank: number,
            rankPercent: number
        }
    > | undefined => {
        const examsInTest = groupBy(exams, 'examName')[testName]?.filter((exam) => {
            return subjects.includes(exam.examSubject as subject)
        })
        if (!examsInTest)
            return undefined

        const validSubjects = examsInTest.map((exam) => exam.examSubject)

        let isok = true
        subjects.forEach((s) => {
            if (!validSubjects.includes(s))
                isok = false
        })
        if (!isok)
            return undefined

        const list: Record<string, number> = {}
        const countList: Record<string, number> = {}
        examsInTest.forEach((exam) => {
            const gradesInExam = groupBy(grades, 'examId')[exam.examId]
            gradesInExam.forEach((grade) => {
                const studentName = getStudentInfo(grade.studentId)?.name!
                if (!list[studentName]) {
                    list[studentName] = grade.value
                    countList[studentName] = 1
                }
                else {
                    list[studentName] += grade.value
                    countList[studentName] += 1
                }
            })
        })


        const filterStudents = Object.keys(countList).filter((name) => {
            return countList[name] !== subjects.length
        })


        filterStudents.forEach((name) => {
            delete list[name]
        })



        const listArr = Object.keys(list).map((studentName) => {
            return {
                studentName,
                value: list[studentName]
            }
        })
        const listSorted = orderBy(listArr, (t) => t.value, ['desc'])
        const res: Record<
            string, {
                value: number,
                rank: number,
                rankPercent: number
            }
        > = {}
        listSorted.forEach((item, index) => {
            const rank = index + 1
            const rankPercent = rank / listSorted.length
            res[item.studentName] = { rank, rankPercent, value: item.value }
        })

        return res
    }, [exams, grades])


    //学生Id找不到成绩返回[]
    const getStudentExams = (studentId: number): ExamAndRank[] => {
        const allExams = groupBy(grades, 'studentId')[studentId]?.map((grade) => {
            return getExamByExamId(grade.examId)!//保证grade一定有相应的exam
        })
        if (!allExams)
            return []

        return allExams.map((exam) => {
            //算排名
            const { rank } = getExamRank(exam.examId, studentId)!
            return {
                ...exam,
                rank
            }
        })
    }

    //获取某整场考试的信息
    const getExamDetail = (year: number, examName: string): {
        examName: string;
        gradesBySubject: {
            subject: string;
            values: {
                name: string;
                studentId: number;
                value: number;
                rank: number;
                rankPercent: number;
            }[];
        }[];
        gradesByStudent: Record<
            string,
            { subject: string; value: number; rank: number; rankPercent: number }[]
        >;
    } | undefined => {
        const examArr = groupBy(exams, 'year')[year]

        //该年份没有考试
        if (!examArr)
            return undefined

        //对应的所有exam
        const examChosen = groupBy(examArr, 'examName')[examName]

        //考试名称找不到考试
        if (!examChosen)
            return undefined

        //gradesBySubject
        const gradesBySubject = examChosen.map((exam) => {
            const subject = exam.examSubject
            //values
            const values = groupBy(grades, 'examId')[exam.examId]!.map((grade) => {//保证exam一定有对应的grade
                const name = getStudentInfo(grade.studentId)!.name
                const studentId = grade.studentId
                const value = grade.value
                const { rank, rankPercent } = getExamRank(grade.examId, grade.studentId)!
                return { name, studentId, value, rank, rankPercent }
            })
            return { subject, values }
        })


        //gradesByStudent
        const gradesByStudent: Record<
            string,
            { subject: string; value: number; rank: number; rankPercent: number }[]
        > = {}

        forEach(students, (student) => {
            const gradeDetail = compact(
                examChosen.map((exam) => {
                    const stuGrade = groupBy(grades, 'examId')[exam.examId]!.find((grade) => {
                        if (grade.studentId === student.studentId)
                            return true
                        else
                            return false
                    })
                    //该生该科考试未参加
                    if (stuGrade === undefined)
                        return undefined
                    const subject = exam.examSubject
                    const value = stuGrade.value
                    const { rank, rankPercent } = getExamRank(exam.examId, student.studentId)!
                    return { subject, value, rank, rankPercent }
                })
            )
            //该生有参加过该次考试中的至少一科
            if (gradeDetail.length !== 0) {
                gradesByStudent[student.name] = gradeDetail
            }

        })

        return { examName, gradesBySubject, gradesByStudent }
    }

    //根据所有考试信息整理得到每年对应的所有考试
    const getTestsList = () => {
        const allYears = Object.keys(groupBy(exams, 'year'))
        const res = allYears.map((y) => {
            const year = Number(y)
            const title = `${year}届所有考试`
            const value = year
            const children = getTestsByYear(year).map((test) => {
                const title = `${test.examName}`
                const value = JSON.stringify(test)
                return {
                    title,
                    value,
                }
            })
            return {
                title,
                value,
                children,
            }
        })
        return res
    }

    // //计算某一批学生在同一届的若干次考试只统计某几科的成绩单(总分，平均分，排名)
    // const getTestsRankWithSubjects = (students: Student[], tests: Test[], year: number, subjects: subject[]): {
    //     rank: number;
    //     rankPercent: number;
    //     student: Student;
    //     sum: number;
    //     average: number;
    // }[] | undefined => {
    //     const allStudents = getStudentsByYear(year)
    //     const testsDetail = compact(tests.map((test) => {
    //         return getTestRankWithSubjects(test.examName, subjects)
    //     }))

    //     if (testsDetail.length === 0)
    //         return undefined

    //     //若学生一次考试都没参加，不计入
    //     const info = compact(allStudents.map((student) => {
    //         const sum = testsDetail.reduce((total, test) => {
    //             return total + ((test[student.name]?.value) ?? 0)
    //         }, 0)

    //         if (sum === 0)
    //             return null

    //         const average = sum / testsDetail.length
    //         return {
    //             student,
    //             sum,
    //             average
    //         }
    //     }))

    //     const infoSorted = orderBy(info, (t) => t.sum, ['desc'])

    //     const res = infoSorted.map((t, i) => {
    //         return {
    //             ...t,
    //             rank: i + 1,
    //             rankPercent: (i + 1) / infoSorted.length
    //         }
    //     })
    //     return res

    // }

    //计算某几年中，各班级及其对应的学生名单
    const getStudentsByClassAndYear = (selectYears: number[]): Record<
        number,
        Record<string, Student[]>
    > => {
        const res: Record<
            number,
            Record<string, Student[]>
        > = {}
        selectYears.forEach((year) => {
            res[year] = {}
            const allStudentsByClass = groupBy(getStudentsByYear(year), 'className')
            const classList = Object.keys(allStudentsByClass)
            classList.forEach((c) => {
                res[year][c] = allStudentsByClass[c]
            })
        })
        return res
    }

    return {
        students,
        exams,
        grades,
        enrollYear,
        getStudentInfo,
        getStudentsByYear,
        getExamsByYear,
        getTestsByYear,
        getStudentExams,
        getExamDetail,
        getTestRankWithSubjects,
        getTestsList,
        getStudentsByClassAndYear
    }
})
