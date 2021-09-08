import React, { useMemo, useState } from 'react'
import { useDataModel } from '@/dataModel'
import { useSchoolList } from '@/dataModel/useSchoolList'
import { TreeSelect } from 'antd';
import { PieImage } from '@/components/PieImage'

export const ClassImage: React.FC<{
    selectYears: number[],
    setIsOpenPanel: any,
    yearAndClass: { year: number, className: string } | null,
    setYearAndClass: React.Dispatch<React.SetStateAction<{
        year: number;
        className: string;
    } | null>>
}> = ({ selectYears, setIsOpenPanel, yearAndClass, setYearAndClass }) => {
    const { getStudentsByClassAndYear } = useDataModel()

    const data = getStudentsByClassAndYear(selectYears)

    const treeData = Object.keys(data).map((y) => {
        const year = Number(y)
        const classes = Object.keys(data[y])
        const children = classes.map((c) => {
            const value = JSON.stringify({ year, className: c })
            return {
                title: c,
                value
            }
        })

        return {
            title: y + '届',
            value: y,
            selectable: false,
            children
        }
    })



    return (
        <>
            <TreeSelect
                style={{ width: '100%' }}
                treeData={treeData}
                showSearch
                allowClear
                treeDefaultExpandAll
                value={yearAndClass === null ? '' : JSON.stringify(yearAndClass)}
                onChange={(v) => {
                    if (!v) {
                        setYearAndClass(null)
                        setIsOpenPanel(false)
                    }
                    else {
                        setYearAndClass(JSON.parse(v))
                        setIsOpenPanel(true)
                    }

                }}
            />
            {
                yearAndClass && <PieImage
                    students={data[yearAndClass.year][yearAndClass.className]}
                    titleSpan={`${yearAndClass.year}届-${yearAndClass.className}`}
                />
            }
        </>
    )
}
