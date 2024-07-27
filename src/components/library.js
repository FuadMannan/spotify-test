import { Navbar } from './navbar';
import { Table, Pagination } from 'react-bootstrap';

export function Library() {
  return (
    <>
      <Navbar />
      <h1>Library</h1>
      <div
        className="d-flex flex-column align-items-center justify-content-center p-5"
        style={{ height: '90vh' }}
      >
        <div id='tableContainer' style={{ overflowY: 'auto', width: '100%' }}>
          <Table striped bordered hover style={{ marginBottom: '0px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th style={{ width: '25vw' }}>Title</th>
                <th style={{ width: '20vw' }}>Artist</th>
                <th style={{ width: '20vw' }}>Album</th>
                <th style={{ width: '15vw' }}>Date added</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );
}
