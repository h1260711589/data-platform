import React from 'react'
import { Student } from '@/dataModel/types'
import { useDataModel } from '@/dataModel'
import { useSchoolList } from '@/dataModel/useSchoolList'
import { Pie } from '@ant-design/charts';

export const PieImage: React.FC<{
    students: Student[],
    titleSpan: string
}> = ({ students, titleSpan }) => {
    const { getStudentsByYear } = useDataModel()
    const { getSchoolData, toSchoolTypeColor } = useSchoolList()

    const schools = students.map((s) => {
        return s.college
    })
    const data = getSchoolData(schools)
    const config: any = {
        data,
        angleField: 'count',
        colorField: 'typeName',
        color: ({ typeName }: any) => {
            return toSchoolTypeColor(typeName)
        },
        radius: 0.9,
        label: {
            type: 'inner',
            offset: '-30%',
            content: function content(_ref: any) {
                var percent = _ref.percent;
                return ''.concat((percent * 100).toFixed(0), '%');
            },
            style: {
                fontSize: 14,
                textAlign: 'center',
            },
        },
        interactions: [{ type: 'element-active' }]
    }
    return (
        <div style={{ height: 250 }}>
            <div
                style={{
                    textAlign: 'center',
                    color: '#303a52',
                    fontWeight: 'bold',
                    marginTop: 25,
                }}
            >
                <span style={{ color: '#2f89fc' }}>{titleSpan}</span>去向分布
            </div>
            < Pie  {...config} />
        </div>
    )
}
