import React, { useState } from 'react'
import { createModel } from 'hox'
import { Student } from '@/dataModel/types'
import { useDataModel } from '@/dataModel'


const dis = (x1: number, y1: number, x2: number, y2: number) => {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)
}

export const useNearbyData = createModel(() => {
    const { getStudentsByYear } = useDataModel()
    const [radius, setRadius] = useState<number>(10)
    const [nearbyStudents, setNearbyStudents] = useState<Student[]>([])
    const [centerStudent, setCenterStudent] = useState<Student | null>(null)
    const [data, setData] = useState<{
        studentName: string;
        enrollYear: number;
        className: string;
        college: string | undefined;
        collegeType: string;
        xAverage: number;
        rankPercentAverageX: number;
        yAverage: number;
        rankPercentAverageY: number;
    }[]>([])

    const getNearbyStudents = (): Student[] => {
        const res: Student[] = []
        const targetStudent = data.find(stu => stu.studentName === centerStudent?.name)
        if (!targetStudent) {
            // setNearbyStudents([])
            return []
        }
        const { rankPercentAverageX: targetX, rankPercentAverageY: targetY } = targetStudent
        data.forEach((stu) => {
            const { rankPercentAverageX: x, rankPercentAverageY: y } = stu
            if (dis(x, y, targetX, targetY) * 10000 < radius * radius) {
                const thisStudent = getStudentsByYear(stu.enrollYear).find(s => s.name === stu.studentName)!
                res.push(thisStudent)
            }
        })
        return res
    }




    return {
        radius,
        setRadius,
        nearbyStudents,
        setNearbyStudents,
        centerStudent,
        setCenterStudent,
        data,
        setData,
        getNearbyStudents
    }
})
