import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { keyword, count = 5 } = await request.json()

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: '关键词不能为空' },
        { status: 400 }
      )
    }

    // Mock Unsplash API 响应
    const mockImages = [
      {
        id: '1',
        urls: {
          regular: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
          small: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
          thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop'
        },
        description: '现代办公环境中的笔记本电脑和咖啡',
        alt_description: '工作桌上的笔记本电脑、咖啡杯和笔记本',
        user: {
          name: 'Kelly Sikkema',
          username: 'kellysikkema'
        },
        likes: 1250,
        width: 800,
        height: 600
      },
      {
        id: '2',
        urls: {
          regular: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
          small: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
          thumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=150&fit=crop'
        },
        description: '团队在会议室讨论项目',
        alt_description: '专业团队在现代化会议室协作',
        user: {
          name: 'Jason Goodman',
          username: 'jasongoodman_youxventures'
        },
        likes: 890,
        width: 800,
        height: 600
      },
      {
        id: '3',
        urls: {
          regular: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
          small: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
          thumb: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop'
        },
        description: '数字创意和科技概念',
        alt_description: '抽象的数字创意背景',
        user: {
          name: 'Luke Chesser',
          username: 'lukechesser'
        },
        likes: 2100,
        width: 800,
        height: 600
      },
      {
        id: '4',
        urls: {
          regular: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
          small: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
          thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop'
        },
        description: '开放式办公室的工作环境',
        alt_description: '明亮的现代化办公空间',
        user: {
          name: 'Jason Blackeye',
          username: 'jasonblackeye'
        },
        likes: 1560,
        width: 800,
        height: 600
      },
      {
        id: '5',
        urls: {
          regular: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=600&fit=crop',
          small: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=300&fit=crop',
          thumb: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=200&h=150&fit=crop'
        },
        description: '创意写作和内容创作',
        alt_description: '笔记本和笔的特写',
        user: {
          name: 'Aaron Burden',
          username: 'aaronburden'
        },
        likes: 980,
        width: 800,
        height: 600
      }
    ]

    // 根据关键词筛选图片（这里简单模拟，实际应该调用真实的Unsplash API）
    const filteredImages = mockImages.slice(0, count)

    return NextResponse.json({
      success: true,
      data: {
        images: filteredImages,
        keyword,
        total: filteredImages.length
      }
    })

  } catch (error) {
    console.error('Unsplash API Error:', error)
    return NextResponse.json(
      { success: false, error: '搜索图片失败' },
      { status: 500 }
    )
  }
}