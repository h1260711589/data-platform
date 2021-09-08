import { Layout, Space, Card, Row, Col } from 'antd';
import DataOverview from './DataOverview'
import { GlobalDistribution } from './GlobalDistribution'
import { SchoolOverview } from './SchoolOverview'
import { LearningCondition } from './LearningCondition'


export default function IndexPage() {
  return (
    <Layout>
      <Layout.Header >
      </Layout.Header >
      <Layout.Content style={{ paddingLeft: 16, paddingRight: 16 }}>
        <Space size={16} direction={'vertical'} style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Card title='数据概览' style={{ height: '100%' }}>
                <DataOverview />
              </Card>
            </Col>
            <Col span={12}>
              <Card title='整体去向分布' style={{ height: '100%' }}>
                <GlobalDistribution />
              </Card>
            </Col>
          </Row>
          <Card title='学校概览' style={{ height: '100%' }}>
            <SchoolOverview />
          </Card>
          <Card title='学情综合' style={{ height: '100%' }}>
            <LearningCondition />
          </Card>
        </Space>
      </Layout.Content>
    </Layout>
  );
}
