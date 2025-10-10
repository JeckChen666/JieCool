"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Modal,
  Message,
  Tag,
} from "@arco-design/web-react";

type ConfigItem = {
  namespace: string;
  env: string;
  key: string;
  type: "string" | "json" | "number" | "bool";
  value: any;
  enabled: boolean;
  version: number;
  description?: string;
  updated_by?: string;
  updated_at?: string;
};

const enabledOptions = [
  { label: "全部", value: "" },
  { label: "启用", value: "true" },
  { label: "禁用", value: "false" },
];

const typeOptions = [
  { label: "字符串", value: "string" },
  { label: "JSON", value: "json" },
  { label: "数字", value: "number" },
  { label: "布尔", value: "bool" },
];

export default function ConfigManagePage() {
  const [filters, setFilters] = useState({
    namespace: "",
    env: "",
    key_like: "",
    enabled: "",
  });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [total, setTotal] = useState(0);

  const [createVisible, setCreateVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [versionsVisible, setVersionsVisible] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsItems, setVersionsItems] = useState<any[]>([]);
  const [currentRow, setCurrentRow] = useState<ConfigItem | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.namespace) params.set("namespace", filters.namespace);
    if (filters.env) params.set("env", filters.env);
    if (filters.key_like) params.set("key_like", filters.key_like);
    if (filters.enabled) params.set("enabled", filters.enabled);
    params.set("page", String(page));
    params.set("size", String(size));
    return params.toString();
  }, [filters, page, size]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/config/list?${queryString}`, { cache: "no-store" });
      const data = await resp.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      Message.error("加载列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const resetFilters = () => {
    setFilters({ namespace: "", env: "", key_like: "", enabled: "" });
    setPage(1);
  };

  const openCreate = () => {
    setCreateVisible(true);
    form.resetFields();
    form.setFieldsValue({ enabled: true, type: "string" });
  };

  const openEdit = (row: ConfigItem) => {
    setCurrentRow(row);
    setEditVisible(true);
    editForm.resetFields();
    let valueStr = "";
    try {
      if (row.type === "json") valueStr = JSON.stringify(row.value, null, 2);
      else valueStr = String(row.value);
    } catch {
      valueStr = "";
    }
    editForm.setFieldsValue({
      namespace: row.namespace,
      env: row.env,
      key: row.key,
      type: row.type,
      value: valueStr,
      enabled: row.enabled,
      description: row.description || "",
      version: row.version,
      change_reason: "frontend-update",
    });
  };

  const openVersions = async (row: ConfigItem) => {
    setCurrentRow(row);
    setVersionsVisible(true);
    setVersionsLoading(true);
    try {
      const params = new URLSearchParams({
        namespace: row.namespace,
        env: row.env,
        key: row.key,
        page: "1",
        size: "20",
      });
      const resp = await fetch(`/api/config/versions?${params.toString()}`, { cache: "no-store" });
      const data = await resp.json();
      setVersionsItems(data.items || []);
    } catch (e) {
      Message.error("加载版本失败");
    } finally {
      setVersionsLoading(false);
    }
  };

  const parseValueByType = (type: ConfigItem["type"], raw: string) => {
    switch (type) {
      case "number": {
        const n = Number(raw);
        if (Number.isNaN(n)) throw new Error("请输入合法数字");
        return n;
      }
      case "bool": {
        const v = raw.trim().toLowerCase();
        if (v === "true" || v === "1") return true;
        if (v === "false" || v === "0") return false;
        throw new Error("请输入 true/false 或 1/0");
      }
      case "json": {
        try {
          return JSON.parse(raw);
        } catch (e) {
          throw new Error("请输入合法 JSON");
        }
      }
      case "string":
      default:
        return raw;
    }
  };

  const submitCreate = async () => {
    try {
      await form.validate();
      const values = form.getFieldsValue();
      const payload = {
        namespace: values.namespace,
        env: values.env,
        key: values.key,
        type: values.type,
        value: parseValueByType(values.type, values.value ?? ""),
        enabled: values.enabled,
        description: values.description || "",
        change_reason: values.change_reason || "frontend-create",
      };
      setCreateLoading(true);
      const resp = await fetch("/api/config/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        Message.success("创建成功");
        setCreateVisible(false);
        fetchList();
      } else {
        Message.error(`创建失败: ${data?.message || resp.status}`);
      }
    } catch (e: any) {
      Message.error(e?.message || "请检查表单输入");
    } finally {
      setCreateLoading(false);
    }
  };

  const submitEdit = async () => {
    try {
      await editForm.validate();
      const values = editForm.getFieldsValue();
      const payload = {
        namespace: values.namespace,
        env: values.env,
        key: values.key,
        type: values.type,
        value: parseValueByType(values.type, values.value ?? ""),
        enabled: values.enabled,
        description: values.description || "",
        version: values.version,
        change_reason: values.change_reason || "frontend-update",
      };
      setEditLoading(true);
      const resp = await fetch("/api/config/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        Message.success("更新成功");
        setEditVisible(false);
        fetchList();
      } else {
        Message.error(`更新失败: ${data?.message || resp.status}`);
      }
    } catch (e: any) {
      Message.error(e?.message || "请检查表单输入");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteRow = async (row: ConfigItem) => {
    Modal.confirm({
      title: "确认删除?",
      content: `将禁用该配置并版本+1: ${row.namespace}/${row.env}/${row.key}`,
      okText: "删除",
      cancelText: "取消",
      onOk: async () => {
        try {
          const payload = {
            namespace: row.namespace,
            env: row.env,
            key: row.key,
            version: row.version,
            change_reason: "frontend-delete",
          };
          const resp = await fetch("/api/config/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await resp.json();
          if (resp.ok && data.ok) {
            Message.success("删除成功");
            fetchList();
          } else {
            Message.error(`删除失败: ${data?.message || resp.status}`);
          }
        } catch (e) {
          Message.error("删除失败");
        }
      },
    });
  };

  const rollbackTo = async (toVersion: number) => {
    if (!currentRow) return;
    try {
      const payload = {
        namespace: currentRow.namespace,
        env: currentRow.env,
        key: currentRow.key,
        to_version: toVersion,
        change_reason: "frontend-rollback",
      };
      const resp = await fetch("/api/config/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        Message.success("回滚成功");
        setVersionsVisible(false);
        fetchList();
      } else {
        Message.error(`回滚失败: ${data?.message || resp.status}`);
      }
    } catch (e) {
      Message.error("回滚失败");
    }
  };

  const columns = [
    { title: "命名空间", dataIndex: "namespace", width: 120 },
    { title: "环境", dataIndex: "env", width: 100 },
    { title: "Key", dataIndex: "key", width: 220 },
    { title: "类型", dataIndex: "type", width: 90 },
    {
      title: "启用",
      dataIndex: "enabled",
      width: 90,
      render: (val: boolean) => (val ? <Tag color="green">启用</Tag> : <Tag color="gray">禁用</Tag>),
    },
    { title: "版本", dataIndex: "version", width: 80 },
    { title: "描述", dataIndex: "description" },
    { title: "更新人", dataIndex: "updated_by", width: 120 },
    { title: "更新时间", dataIndex: "updated_at", width: 180 },
    {
      title: "操作",
      dataIndex: "_ops",
      width: 240,
      render: (_: any, row: ConfigItem) => (
        <Space>
          <Button size="mini" type="primary" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button size="mini" status="danger" onClick={() => deleteRow(row)}>
            删除
          </Button>
          <Button size="mini" onClick={() => openVersions(row)}>
            版本
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>动态配置管理</h2>

      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <Form layout="inline">
          <Form.Item label="命名空间">
            <Input
              allowClear
              value={filters.namespace}
              onChange={(v) => setFilters((s) => ({ ...s, namespace: v }))}
              placeholder="如 core"
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item label="环境">
            <Input
              allowClear
              value={filters.env}
              onChange={(v) => setFilters((s) => ({ ...s, env: v }))}
              placeholder="如 prod"
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item label="Key包含">
            <Input
              allowClear
              value={filters.key_like}
              onChange={(v) => setFilters((s) => ({ ...s, key_like: v }))}
              placeholder="模糊匹配"
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              value={filters.enabled}
              onChange={(v) => setFilters((s) => ({ ...s, enabled: v }))}
              style={{ width: 120 }}
              options={enabledOptions}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={() => fetchList()}>
                查询
              </Button>
              <Button onClick={resetFilters}>重置</Button>
              <Button type="secondary" onClick={openCreate}>
                新增配置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          loading={loading}
          data={items}
          columns={columns as any}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: (p) => setPage(p),
            onPageSizeChange: (s) => {
              setSize(s);
              setPage(1);
            },
            showJumper: true,
            showPageSize: true,
          }}
          rowKey={(row) => `${row.namespace}:${row.env}:${row.key}`}
        />
      </Space>

      <Modal
        title="新增配置"
        visible={createVisible}
        onOk={submitCreate}
        confirmLoading={createLoading}
        onCancel={() => setCreateVisible(false)}
        okText="提交"
        cancelText="取消"
      >
                <Form form={form} layout="horizontal">
          <Form.Item label="命名空间" field="namespace" rules={[{ required: true }]}>
            <Input placeholder="如 core" />
          </Form.Item>
          <Form.Item label="环境" field="env" rules={[{ required: true }]}>
            <Input placeholder="如 prod" />
          </Form.Item>
          <Form.Item label="Key" field="key" rules={[{ required: true }]}>
            <Input placeholder="如 FeatureX" />
          </Form.Item>
          <Form.Item label="类型" field="type" rules={[{ required: true }]}> 
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item label="值" field="value" rules={[{ required: true }]}> 
            <Input.TextArea placeholder="字符串 / JSON / 数字 / 布尔" autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item label="启用" field="enabled" rules={[{ required: true }]}> 
            <Switch />
          </Form.Item>
          <Form.Item label="描述" field="description"> 
            <Input.TextArea placeholder="用途说明" autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item label="变更原因" field="change_reason"> 
            <Input placeholder="记录本次变更原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑配置"
        visible={editVisible}
        onOk={submitEdit}
        confirmLoading={editLoading}
        onCancel={() => setEditVisible(false)}
        okText="提交"
        cancelText="取消"
      >
                <Form form={editForm} layout="horizontal">
          <Form.Item label="命名空间" field="namespace" rules={[{ required: true }]}> 
            <Input disabled />
          </Form.Item>
          <Form.Item label="环境" field="env" rules={[{ required: true }]}> 
            <Input disabled />
          </Form.Item>
          <Form.Item label="Key" field="key" rules={[{ required: true }]}> 
            <Input disabled />
          </Form.Item>
          <Form.Item label="类型" field="type" rules={[{ required: true }]}> 
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item label="值" field="value" rules={[{ required: true }]}> 
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item label="启用" field="enabled" rules={[{ required: true }]}> 
            <Switch />
          </Form.Item>
          <Form.Item label="描述" field="description"> 
            <Input.TextArea autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item label="版本" field="version" rules={[{ required: true }]}> 
            <Input disabled />
          </Form.Item>
          <Form.Item label="变更原因" field="change_reason"> 
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="版本历史"
        visible={versionsVisible}
        onCancel={() => setVersionsVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <Table
          loading={versionsLoading}
          data={versionsItems}
          rowKey={(r: any) => String(r.version)}
          columns={[
            { title: "版本", dataIndex: "version", width: 100 },
            { title: "变更人", dataIndex: "changed_by", width: 120 },
            { title: "变更原因", dataIndex: "change_reason" },
            { title: "时间", dataIndex: "created_at", width: 200 },
            {
              title: "操作",
              dataIndex: "_ops",
              width: 160,
              render: (_: any, row: any) => (
                <Button size="mini" onClick={() => rollbackTo(row.version)}>
                  回滚到此版本
                </Button>
              ),
            },
          ] as any}
        />
      </Modal>
    </div>
  );
}