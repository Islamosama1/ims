import React, { useState, useEffect } from 'react';
import {
  Button,
  Tabs,
  Table,
  Empty,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
} from 'antd';
import axios from 'axios';
// import BaseAPIs from '../api/base.api';
import { Link } from 'react-router-dom';

const { TabPane } = Tabs;

interface Program {
  key: string;
  title: string;
  description: string;
}

const Programs: React.FC = () => {
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchPrograms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/programs'); // Your backend API route
      const programs = response.data.map((program: any) => ({
        key: program.id, // Assuming programs have an _id
        name: program.name,
        description: program.description,
      }));
      setData(programs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching programs', error);
      message.error('Failed to load programs');
      setLoading(false);
    }
  };

  // Handle form submission
  const handleCreate = async (values: { name: string; description: any }) => {
    try {
      await axios.post('http://localhost:5000/api/v1/programs', {
        name: values.name,
        description: values.description, // Use Dayjs for date formatting
      });
      message.success('Task created successfully');
      setIsModalVisible(false);
      form.resetFields(); // Reset form fields
      fetchPrograms(); // Refetch programs after creation
    } catch (error) {
      console.error('Error creating task', error);
      message.error('Failed to create task');
    }
  };

  // Delete a task
  // const handleDelete = async (id: string) => {
  //   try {
  //     await axios.delete(`http://localhost:5000/api/v1/programs/${id}`);
  //     message.success('Task deleted successfully');
  //     fetchPrograms(); // Refetch programs after deletion
  //   } catch (error) {
  //     console.error('Error deleting task', error);
  //     message.error('Failed to delete task');
  //   }
  // };

  // Define table columns
  const columns = [
    {
      title: 'Program Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description, // Use Dayjs to format the date
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: any, record: Program) => (
        <Button type="link">
          <Link to={`/programs/${record.key}`}>View tasks</Link>
        </Button>
      ),
    },
  ];

  // Show modal
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Hide modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Load programs on component mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  return (
    <div
      style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '4px' }}
    >
      <h1>programs</h1>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Active" key="1">
          {loading ? (
            <p>Loading...</p>
          ) : data.length ? (
            <Table columns={columns} dataSource={data} pagination={false} />
          ) : (
            <Empty description="No programs" />
          )}
        </TabPane>
        <TabPane tab="Archived" key="2">
          <Empty description="No programs" />
        </TabPane>
      </Tabs>
      <Button type="primary" style={{ marginTop: '16px' }} onClick={showModal}>
        Create program
      </Button>

      {/* Modal for creating task */}
      <Modal
        title="Create Program"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate}>
          <Form.Item
            label="Program Name"
            name="name"
            rules={[
              { required: true, message: 'Please input the program name!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="description"
            name="description"
            rules={[
              { required: true, message: 'Please select a description!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create Program
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Programs;
