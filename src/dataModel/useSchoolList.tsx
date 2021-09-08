import React, { useState, useLayoutEffect } from 'react'
import { getSchoolList } from '@/loader'
import { createModel } from 'hox'
import { School, SchoolType, Student } from './types'
import { keyBy, countBy, compact } from 'lodash'
import { groupBy } from 'lodash'

export const useSchoolList = createModel(() => {
    const [schoolList, setSchoolList] = useState<School[]>([])

    useLayoutEffect(() => {
        setSchoolList(getSchoolList())
    }, [])

    //学校类型数组
    const SchoolTypeList = [
        SchoolType.Above211,
        SchoolType.ShangHaiGongBan,
        SchoolType.ShangHaiMingBan,
        SchoolType.WaiDiGongBan,
        SchoolType.WaiDiMingBan,
        SchoolType.ZhuanKe,
        SchoolType.Others,
        SchoolType.Empty,
    ];

    //根据学校类型号得到学校类型
    const toSchoolTypeName = (t: SchoolType) => {
        switch (t) {
            case SchoolType.Above211:
                return '211以上';
            case SchoolType.ShangHaiGongBan:
                return '上海公办';
            case SchoolType.ShangHaiMingBan:
                return '上海民办';
            case SchoolType.WaiDiGongBan:
                return '外地公办';
            case SchoolType.WaiDiMingBan:
                return '外地民办';
            case SchoolType.ZhuanKe:
                return '专科';
            case SchoolType.Others:
                return '其他';
            case SchoolType.Empty:
                return '未填写';
            default:
                return '未知学校类型';
        }
    };

    const config = {
        '211以上': 'orange',
        上海公办: 'limegreen',
        上海民办: 'deepskyblue',
        外地公办: '#ba53de',
        外地民办: '#e7b3b3',
        专科: '#E6747C',
        其他: '#364f6b',
    };

    //根据学校名称得到相应类型
    const getSchoolTypeByName = (school: string | undefined = '') => {
        const schoolAsKeyList = keyBy(schoolList, (s) => s.name)
        const type = schoolAsKeyList[school]?.schoolType
        const typeName = toSchoolTypeName(type)
        return typeName
    }

    //根据学校类型得到相应颜色
    const toSchoolTypeColor = (t: string | undefined = '') =>
        config[t] ?? 'gray';

    //根据学校名称得到相应颜色
    const toSchoolTypeColorByName = (school: string | undefined = '') => {
        const typeName = getSchoolTypeByName(school)
        return toSchoolTypeColor(typeName)
    }

    //过滤掉学校类型异常的学生
    const filterStudent = (students: Student[]) => {
        const schoolAsKeyList = keyBy(schoolList, (s) => s.name)
        return students.filter(s => {
            if (!s.college)
                return false
            if (!schoolAsKeyList[s.college])
                return false
            const t = toSchoolTypeName(schoolAsKeyList[s.college].schoolType)
            return t !== '其他' && t !== '未填写' && t !== '未知学校类型'
        })
    }


    //学生的学校分类数据
    const getSchoolData = (schools: (string | undefined)[]): { typeName: String, count: number }[] => {
        const schoolAsKeyList = keyBy(schoolList, (s) => s.name)

        //学校类型名组成的数组
        const schoolTypeList = schools.map((s) => {
            if (!s)
                return '未填写'
            if (!schoolAsKeyList[s])
                return '未知学校类型'
            return toSchoolTypeName(schoolAsKeyList[s].schoolType)
        })

        //各个类型名对应数量的对象
        const countList = countBy(schoolTypeList, t => t)

        const res = Object.keys(countList).map((typeName) => {
            return {
                typeName,
                count: countList[typeName]
            }
        })
        return res
    }

    //根据学生获得他们学校的分类数据(学校类型-{人数，百分比，对应的学校})，排除未填写或未知类型
    const getSchoolClassification = (students: Student[]): Record<
        string,
        {
            count: number,
            percent: number,
            schoolList: Record<string, number>
        }
    > => {
        const schools = compact(students.map(s => s.college))
        const schoolAsKeyList = keyBy(schoolList, (s) => s.name)
        const schoolTypeList = compact(schools.map((s) => {
            if (!s)
                return null
            if (!schoolAsKeyList[s])
                return null
            return { type: toSchoolTypeName(schoolAsKeyList[s].schoolType), school: s }
        })).filter(s => s.type !== '其他' && s.type !== '未填写' && s.type !== '未知学校类型')


        const classification = schoolTypeList.reduce((res, s): Record<
            string,
            {
                count: number,
                percent: number,
                schoolList: Record<string, number>
            }
        > => {
            if (!res[s.type]) {
                res[s.type] = {
                    count: 1,
                    schoolList: [s.school]
                }
                return res
            }
            else {
                res[s.type].count++
                res[s.type].schoolList.push(s.school)
                return res
            }
        }, {})

        Object.keys(classification).forEach((type) => {
            classification[type].percent = classification[type].count / schoolTypeList.length
            const arr = classification[type].schoolList
            classification[type].schoolList = groupBy(arr, (i) => i)
            Object.keys(classification[type].schoolList).forEach(s => {
                classification[type].schoolList[s] = classification[type].schoolList[s].length

            })
        })
        return classification
    }

    return {
        SchoolTypeList,
        schoolList,
        getSchoolData,
        toSchoolTypeColor,
        toSchoolTypeName,
        toSchoolTypeColorByName,
        getSchoolTypeByName,
        getSchoolClassification,
        filterStudent
    }
})
