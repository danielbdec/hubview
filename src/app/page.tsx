import { Button, Card, Col, Row, Typography } from "antd";

const { Title } = Typography;

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <header className="mb-8">
        <Title level={2} style={{ margin: 0 }}>Gestão à Vista - Uninova Hubview</Title>
        <p className="text-gray-500">Visão geral dos projetos e entregas</p>
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Planejamento" extra={<Button type="link">Ver mais</Button>}>
            <p>Acompanhe o backlog e refino.</p>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Em Desenvolvimento" extra={<Button type="link">Ver mais</Button>}>
            <p>Tarefas em execução na sprint.</p>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Entregas" extra={<Button type="link">Ver mais</Button>}>
            <p>Validação e deploy.</p>
          </Card>
        </Col>
      </Row>
    </main>
  );
}
