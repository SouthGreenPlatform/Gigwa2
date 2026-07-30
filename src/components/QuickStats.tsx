import { Col, Card, Table } from "react-bootstrap";
import "../styles/variant-modal.scss";

export interface QuickStatsObject {
  size: number;
  missingData: number;
  heterozygosity: number;
  MAF: number;
}

interface QuickStatsProps {
  title?: string;
  stats?: QuickStatsObject;
  cardClassName?: string;
  cardStyle?: React.CSSProperties;
  cardHeaderClassName?: string;
  cardHeaderStyle?: React.CSSProperties;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  title = "Quick stats",
  stats = {
    size: 0,
    missingData: 0,
    heterozygosity: 0,
    MAF: 0,
  },
  cardClassName = "",
  cardStyle = {},
  cardHeaderClassName = "",
  cardHeaderStyle = {},
}) => {
  return (
    <Col md={3} xs={12}>
      <Card className={cardClassName} style={cardStyle}>
        <Card.Header className={cardHeaderClassName}>
          <h5>{title}</h5>
        </Card.Header>
        <Card.Body>
          <Table bordered hover>
            <tbody>
              <tr>
                <td>Individuals</td>
                <td>{stats.size}</td>
              </tr>
              <tr>
                <td>Missing Data</td>
                <td>{stats.missingData}%</td>
              </tr>
              <tr>
                <td>Heterozygosity</td>
                <td>{stats.heterozygosity}%</td>
              </tr>
              <tr>
                <td>MAF</td>
                <td>{stats.MAF}%</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default QuickStats;
